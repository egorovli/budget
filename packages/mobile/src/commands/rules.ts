import type { Currency } from '../book/money.ts'
import { parseAmount } from '../book/money.ts'
import type { CommandDraft, CommandKind, InterpreterContext } from './draft.ts'
import { emptyDraft } from './draft.ts'

// A deterministic interpreter for English, Russian and Polish sentences. It reads one
// sentence into a CommandDraft that the user then confirms on a form.

interface Token {
	raw: string
	/** Lower case, without diacritics; Cyrillic stays Cyrillic. */
	lower: string
	/** `lower` transliterated to Latin letters and digits only. */
	latin: string
	start: number
	end: number
}

interface Span {
	start: number
	end: number
}

interface NameMatch {
	id: string
	first: number
	last: number
	exact: boolean
	role: 'from' | 'to' | null
}

type Field = CommandDraft['uncertain'][number]

const tokenPattern = /[\p{L}\p{M}\p{N}€$₽֏]+/gu
const markPattern = /\p{M}/gu
const digitPattern = /\p{N}/gu
const latinPattern = /[^a-z0-9]/g
const spacePattern = /\s+/u
const isoPattern = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/gu
const numericDatePattern = /(?<![\d.,])(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?(?![\d,]|\.\d)/gu
const ordinalPattern = /(?<!\d)(\d{1,2})(?:st|nd|rd|th)(?!\p{L})/giu
const dayMonthPattern = /(?<![\d.,])(\d{1,2})\s+(\p{L}+)/gu
const monthDayPattern = /(\p{L}+)\s+(\d{1,2})(?:st|nd|rd|th)?(?![\p{N}\p{L}]|[.,]\d)/giu
const nextWordPattern = /^\s*([^\s]+)/u
const amountPattern = /(?<![\p{N}.,])(\d{1,3}(?:[   ]\d{3})+|\d+)(?:[.,](\d{1,2}))?(?!\d)/u
const halfPattern = /^\s*(?:с половиной|and a half|i pół|i pol)(?!\p{L})/iu

const transliteration: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'g',
	д: 'd',
	е: 'e',
	ж: 'zh',
	з: 'z',
	и: 'i',
	й: 'i',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'h',
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'sch',
	ъ: '',
	ы: 'y',
	ь: '',
	э: 'e',
	ю: 'yu',
	я: 'ya'
}

function lowerOf(text: string): string {
	return text.toLowerCase().normalize('NFD').replace(markPattern, '').replaceAll('ł', 'l')
}

function latinOf(lower: string): string {
	let result = ''
	for (const char of lower) {
		result += transliteration[char] ?? char
	}
	return result.replace(latinPattern, '')
}

function tokenize(text: string): Token[] {
	const tokens: Token[] = []
	for (const match of text.matchAll(tokenPattern)) {
		const lower = lowerOf(match[0])
		tokens.push({
			raw: match[0],
			lower,
			latin: latinOf(lower),
			start: match.index,
			end: match.index + match[0].length
		})
	}
	return tokens
}

function startsWithAny(word: string, stems: readonly string[]): boolean {
	return stems.some(stem => word.startsWith(stem))
}

// Kind keywords: stems that a lower-case token starts with, or phrases in the sentence.

const transferStems = [
	'transfer',
	'move',
	'перевод',
	'перевед',
	'перевест',
	'перекин',
	'przelew',
	'przelej',
	'przelal',
	'przenie',
	'przesl'
]
const transferPhrases = ['send to my', 'sent to my']
const incomeStems = [
	'salary',
	'receiv',
	'refund',
	'earned',
	'income',
	'зарплат',
	'получил',
	'пришл',
	'вернул',
	'доход',
	'wyplat',
	'dostal',
	'otrzymal',
	'zwrot',
	'przychod',
	'pensj'
]
const incomePhrases = ['got paid', 'get paid']
const balanceStems = ['balance', 'баланс', 'остат', 'saldo']
const reserveVerbStems = ['отлож', 'odloz', 'odkl', 'zarezerw']
const reservePhrases = ['put aside', 'set aside', 'save for', 'save up', 'saving for']
const reserveNounStems = ['reserv', 'резерв', 'rezerw']
const expenseStems = [
	'spent',
	'spend',
	'paid',
	'pay',
	'bought',
	'buy',
	'купил',
	'куплен',
	'потрат',
	'заплат',
	'оплат',
	'платеж',
	'kupil',
	'wydal',
	'zaplac',
	'platnos',
	'oplac'
]
const createStems = [
	'add',
	'create',
	'new',
	'open',
	'добав',
	'созда',
	'нов',
	'откр',
	'dodaj',
	'utworz',
	'now',
	'otworz',
	'zaloz'
]
const accountNounStems = [
	'account',
	'card',
	'wallet',
	'счет',
	'карт',
	'кошел',
	'konto',
	'kart',
	'portfel'
]

const dateWords: Record<string, number> = {
	today: 0,
	сегодня: 0,
	dzis: 0,
	dzisiaj: 0,
	yesterday: -1,
	вчера: -1,
	wczoraj: -1,
	позавчера: -2,
	przedwczoraj: -2
}

const cashStems = ['cash', 'nalichn', 'nalik', 'gotowk']

const merchantPreps = new Set(['at', 'в', 'во', 'w', 'we', 'u', 'у'])
const purposePreps = new Set(['for', 'на', 'na', 'za'])
const fromPreps = new Set(['from', 'с', 'со', 'z', 'ze', 'из', 'od'])
const toPreps = new Set(['to', 'into', 'на', 'na', 'do'])
const fillers = new Set([
	'my',
	'the',
	'a',
	'an',
	'мои',
	'моя',
	'мою',
	'моего',
	'моеи',
	'моем',
	'moj',
	'moja',
	'moje',
	'mojej',
	'mojego',
	'mego',
	'card',
	'карты',
	'карту',
	'karty',
	'karte',
	'account',
	'счета',
	'konta'
])
const stopWords = new Set([
	...merchantPreps,
	...purposePreps,
	...fromPreps,
	...toPreps,
	...fillers,
	'and',
	'и',
	'i',
	'with',
	'of',
	'on',
	'in',
	'по',
	'за',
	'today',
	'new'
])

const currencyWords: readonly { currency: Currency; exact: string[]; stems: string[] }[] = [
	{ currency: 'PLN', exact: ['pln', 'zl'], stems: ['zlot', 'злот'] },
	{ currency: 'EUR', exact: ['eur', '€', 'евро'], stems: ['euro'] },
	{ currency: 'USD', exact: ['usd', '$'], stems: ['dollar', 'dolar', 'доллар', 'бакс'] },
	{ currency: 'RUB', exact: ['rub', '₽', 'руб'], stems: ['рубл', 'rubl'] },
	{ currency: 'AMD', exact: ['amd', '֏'], stems: ['драм', 'dram'] }
]

function currencyOf(token: Token): Currency | null {
	const word = token.lower.replace(digitPattern, '')
	if (word === '') {
		return null
	}
	const found = currencyWords.find(
		entry => entry.exact.includes(word) || startsWithAny(word, entry.stems)
	)
	return found ? found.currency : null
}

// Months: English names and abbreviations, Russian stems, Polish forms (without diacritics).
const months: readonly { exact: string[]; stems: string[] }[] = [
	{ exact: ['jan', 'january', 'stycznia', 'styczen'], stems: ['январ'] },
	{ exact: ['feb', 'february', 'lutego', 'luty'], stems: ['феврал'] },
	{ exact: ['mar', 'march', 'marca', 'marzec'], stems: ['март'] },
	{ exact: ['apr', 'april', 'kwietnia', 'kwiecien'], stems: ['апрел'] },
	{ exact: ['may', 'maja', 'maj', 'мая', 'маи'], stems: [] },
	{ exact: ['jun', 'june', 'czerwca', 'czerwiec'], stems: ['июн'] },
	{ exact: ['jul', 'july', 'lipca', 'lipiec'], stems: ['июл'] },
	{ exact: ['aug', 'august', 'sierpnia', 'sierpien'], stems: ['август'] },
	{ exact: ['sep', 'sept', 'september', 'wrzesnia', 'wrzesien'], stems: ['сентябр'] },
	{ exact: ['oct', 'october', 'pazdziernika', 'pazdziernik'], stems: ['октябр'] },
	{ exact: ['nov', 'november', 'listopada', 'listopad'], stems: ['ноябр'] },
	{ exact: ['dec', 'december', 'grudnia', 'grudzien'], stems: ['декабр'] }
]

function monthOf(word: string): number | null {
	const lower = lowerOf(word)
	const index = months.findIndex(
		month => month.exact.includes(lower) || startsWithAny(lower, month.stems)
	)
	return index < 0 ? null : index + 1
}

// Dates: plain arithmetic on YYYY-MM-DD strings in UTC, never the device time zone.

function toIso(year: number, month: number, day: number): string | null {
	const date = new Date(Date.UTC(year, month - 1, day))
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) {
		return null
	}
	return date.toISOString().slice(0, 10)
}

function parts(iso: string): [number, number, number] {
	const [year = '0', month = '0', day = '0'] = iso.split('-')
	return [Number(year), Number(month), Number(day)]
}

function addDays(iso: string, days: number): string {
	const [year, month, day] = parts(iso)
	return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

/** A day and month without a year: the latest such date that is not after today. */
function pastDate(month: number, day: number, today: string): string | null {
	const [year] = parts(today)
	const date = toIso(year, month, day)
	if (date === null || date <= today) {
		return date
	}
	return toIso(year - 1, month, day)
}

function pastDay(day: number, today: string): string | null {
	const [year, month] = parts(today)
	const date = toIso(year, month, day)
	if (date !== null && date <= today) {
		return date
	}
	const previous = addDays(`${year}-${String(month).padStart(2, '0')}-01`, -1)
	const [previousYear, previousMonth] = parts(previous)
	return toIso(previousYear, previousMonth, day)
}

interface DateMatch {
	date: string
	span: Span
}

function followedByCurrency(text: string, end: number): boolean {
	const next = nextWordPattern.exec(text.slice(end))
	if (!next) {
		return false
	}
	return tokenize(next[1] ?? '').some(token => currencyOf(token) !== null)
}

function findDate(text: string, today: string): DateMatch | null {
	for (const match of text.matchAll(isoPattern)) {
		const date = toIso(Number(match[1]), Number(match[2]), Number(match[3]))
		if (date !== null) {
			return { date, span: { start: match.index, end: match.index + match[0].length } }
		}
	}
	for (const match of text.matchAll(numericDatePattern)) {
		const end = match.index + match[0].length
		if (followedByCurrency(text, end)) {
			continue
		}
		const day = Number(match[1])
		const month = Number(match[2])
		const date = match[3] ? toIso(Number(match[3]), month, day) : pastDate(month, day, today)
		if (date !== null) {
			return { date, span: { start: match.index, end } }
		}
	}
	for (const match of text.matchAll(dayMonthPattern)) {
		const month = monthOf(match[2] ?? '')
		const date = month === null ? null : pastDate(month, Number(match[1]), today)
		if (date !== null) {
			return { date, span: { start: match.index, end: match.index + match[0].length } }
		}
	}
	for (const match of text.matchAll(monthDayPattern)) {
		const month = monthOf(match[1] ?? '')
		const date = month === null ? null : pastDate(month, Number(match[2]), today)
		if (date !== null) {
			return { date, span: { start: match.index, end: match.index + match[0].length } }
		}
	}
	for (const match of text.matchAll(ordinalPattern)) {
		const date = pastDay(Number(match[1]), today)
		if (date !== null) {
			return { date, span: { start: match.index, end: match.index + match[0].length } }
		}
	}
	return null
}

interface AmountMatch {
	amount: string
	span: Span
}

function findAmount(text: string): AmountMatch | null {
	const match = amountPattern.exec(text)
	if (!match) {
		return null
	}
	const fraction = match[2]
	let amount = parseAmount(fraction ? `${match[1]}.${fraction}` : (match[1] ?? ''))
	let end = match.index + match[0].length
	const half = halfPattern.exec(text.slice(end))
	if (half && amount !== null && !fraction) {
		amount = (BigInt(amount) + 50n).toString()
		end += half[0].length
	}
	if (amount === null || BigInt(amount) <= 0n) {
		return null
	}
	return { amount, span: { start: match.index, end } }
}

function mask(text: string, span: Span): string {
	return text.slice(0, span.start) + ' '.repeat(span.end - span.start) + text.slice(span.end)
}

// Names of Accounts and Reserves: matched case- and diacritic-insensitively, through
// transliteration, and by stem for inflected forms ("революта" → Revolut).

function wordMatch(token: string, word: string): 'exact' | 'stem' | null {
	if (token === word) {
		return 'exact'
	}
	if (startsWithAny(token, cashStems) && startsWithAny(word, cashStems)) {
		return 'stem'
	}
	const size = Math.max(4, word.length - 2)
	if (word.length < 4 || token.length < size) {
		return null
	}
	return token.slice(0, size) === word.slice(0, size) ? 'stem' : null
}

function roleBefore(tokens: readonly Token[], index: number): NameMatch['role'] {
	let position = index - 1
	while (position >= 0 && fillers.has(tokens[position]?.lower ?? '')) {
		position -= 1
	}
	const word = tokens[position]?.lower ?? ''
	if (fromPreps.has(word)) {
		return 'from'
	}
	if (toPreps.has(word)) {
		return 'to'
	}
	return null
}

function findNames(
	tokens: readonly Token[],
	items: readonly { id: string; name: string }[],
	blocked: Set<number>
): NameMatch[] {
	const words = items.map(item =>
		item.name
			.split(spacePattern)
			.map(part => latinOf(lowerOf(part)))
			.filter(part => part !== '')
	)
	const found: NameMatch[] = []
	for (let index = 0; index < tokens.length; index += 1) {
		for (const [itemIndex, item] of items.entries()) {
			const nameWords = words[itemIndex] ?? []
			if (nameWords.length === 0 || found.some(match => match.id === item.id)) {
				continue
			}
			let exact = true
			const matched = nameWords.every((word, offset) => {
				const token = tokens[index + offset]
				if (!token || blocked.has(index + offset) || token.latin === '') {
					return false
				}
				const result = wordMatch(token.latin, word)
				exact &&= result === 'exact'
				return result !== null
			})
			if (matched) {
				const last = index + nameWords.length - 1
				found.push({ id: item.id, first: index, last, exact, role: roleBefore(tokens, index) })
				for (let used = index; used <= last; used += 1) {
					blocked.add(used)
				}
				break
			}
		}
	}
	return found
}

function hasStem(
	tokens: readonly Token[],
	stems: readonly string[],
	keywords: Set<number>
): boolean {
	let found = false
	for (const [index, token] of tokens.entries()) {
		if (startsWithAny(token.lower, stems)) {
			keywords.add(index)
			found = true
		}
	}
	return found
}

function hasPhrase(sentence: string, phrases: readonly string[]): boolean {
	return phrases.some(phrase => sentence.includes(` ${phrase} `))
}

/** Index of an account noun near a create verb ("add account", "dodaj nowe konto"). */
function accountNounIndex(tokens: readonly Token[]): number {
	for (const [index, token] of tokens.entries()) {
		if (!startsWithAny(token.lower, accountNounStems)) {
			continue
		}
		for (let offset = 1; offset <= 3; offset += 1) {
			const before = tokens[index - offset]
			if (before && startsWithAny(before.lower, createStems)) {
				return index
			}
		}
	}
	return -1
}

function collectWords(tokens: readonly Token[], start: number, stopped: Set<number>): string {
	const words: string[] = []
	for (let index = start; index < tokens.length && words.length < 3; index += 1) {
		const token = tokens[index]
		if (!token || stopped.has(index) || stopWords.has(token.lower)) {
			break
		}
		words.push(token.raw)
	}
	return words.join(' ')
}

function noteAfter(
	tokens: readonly Token[],
	preps: Set<string>,
	stopped: Set<number>
): string | null {
	for (const [index, token] of tokens.entries()) {
		if (stopped.has(index) || !preps.has(token.lower)) {
			continue
		}
		const words = collectWords(tokens, index + 1, stopped)
		if (words !== '') {
			return words
		}
	}
	return null
}

function joinNote(values: readonly (string | null)[]): string | null {
	const present = values.filter(part => part !== null && part !== '')
	return present.length > 0 ? present.join(' · ') : null
}

function detectKind(
	tokens: readonly Token[],
	sentence: string,
	keywords: Set<number>,
	accounts: readonly NameMatch[],
	hasAmount: boolean
): CommandKind {
	if (accountNounIndex(tokens) >= 0) {
		return 'account'
	}
	const transfer = hasStem(tokens, transferStems, keywords)
	if (transfer || hasPhrase(sentence, transferPhrases)) {
		return 'transfer'
	}
	if (hasStem(tokens, reserveVerbStems, keywords) || hasPhrase(sentence, reservePhrases)) {
		return 'reserve'
	}
	if (hasStem(tokens, balanceStems, keywords)) {
		return 'balance'
	}
	if (hasPhrase(sentence, incomePhrases) || hasStem(tokens, incomeStems, keywords)) {
		return 'income'
	}
	if (hasStem(tokens, expenseStems, keywords)) {
		return 'expense'
	}
	if (accounts.length >= 2 && accounts.some(match => match.role !== null)) {
		return 'transfer'
	}
	if (hasStem(tokens, reserveNounStems, keywords)) {
		return 'reserve'
	}
	return hasAmount ? 'expense' : 'unknown'
}

function setName(
	draft: CommandDraft,
	field: 'accountId' | 'toAccountId' | 'reserveId',
	match: NameMatch | undefined,
	uncertain: Set<Field>
): void {
	if (!match) {
		return
	}
	draft[field] = match.id
	if (!match.exact) {
		uncertain.add(field)
	}
}

export function interpretWithRules(text: string, context: InterpreterContext): CommandDraft {
	const draft = emptyDraft()
	draft.sources = ['rules']
	const uncertain = new Set<Field>()

	let working = text
	const date = findDate(working, context.today)
	if (date) {
		draft.date = date.date
		working = mask(working, date.span)
	}
	const amount = findAmount(working)
	const spans: Span[] = []
	if (date) {
		spans.push(date.span)
	}
	if (amount) {
		draft.amount = amount.amount
		spans.push(amount.span)
	}

	const tokens = tokenize(text)
	const sentence = ` ${tokens.map(token => token.lower).join(' ')} `
	const stopped = new Set<number>()
	for (const [index, token] of tokens.entries()) {
		if (spans.some(span => token.start < span.end && token.end > span.start)) {
			stopped.add(index)
			continue
		}
		const currency = currencyOf(token)
		if (currency !== null) {
			draft.currency ??= currency
			stopped.add(index)
		}
		const shift = dateWords[token.lower]
		if (shift !== undefined) {
			stopped.add(index)
			if (draft.date === null) {
				const before = sentence.includes(' day before yesterday ') ? -2 : shift
				draft.date = addDays(context.today, before)
			}
		}
	}
	// Currency symbols glued to the amount ("€200", "27.50zł") belong to masked tokens.
	if (draft.currency === null) {
		for (const index of stopped) {
			const token = tokens[index]
			const currency = token ? currencyOf(token) : null
			if (currency !== null) {
				draft.currency = currency
				break
			}
		}
	}

	const keywords = new Set<number>()
	const accountBlocked = new Set(stopped)
	const accountMatches = findNames(tokens, context.accounts, accountBlocked)
	const kind = detectKind(tokens, sentence, keywords, accountMatches, amount !== null)
	draft.kind = kind

	if (kind === 'account') {
		const noun = accountNounIndex(tokens)
		const blocked = new Set([...stopped, noun])
		const name = collectWords(tokens, noun + 1, blocked)
		draft.note = name === '' ? null : name
		draft.uncertain = [...uncertain]
		return draft
	}

	const reserveBlocked = new Set(accountBlocked)
	const reserveMatches = findNames(tokens, context.reserves, reserveBlocked)
	setName(draft, 'reserveId', reserveMatches[0], uncertain)

	if (kind === 'transfer') {
		let source = accountMatches.find(match => match.role === 'from')
		let target = accountMatches.find(match => match.role === 'to' && match !== source)
		const rest = accountMatches.filter(match => match !== source && match !== target)
		source ??= rest.shift()
		target ??= rest.shift()
		setName(draft, 'accountId', source, uncertain)
		setName(draft, 'toAccountId', target, uncertain)
	} else if (kind === 'income') {
		const target = accountMatches.find(match => match.role === 'to') ?? accountMatches[0]
		setName(draft, 'accountId', target, uncertain)
	} else {
		const source = accountMatches.find(match => match.role === 'from') ?? accountMatches[0]
		setName(draft, 'accountId', source, uncertain)
	}

	const noteStops = new Set([
		...(kind === 'reserve' ? accountBlocked : reserveBlocked),
		...keywords
	])
	if (kind === 'reserve') {
		draft.note = noteAfter(tokens, purposePreps, noteStops)
	} else {
		draft.note = joinNote([
			noteAfter(tokens, merchantPreps, noteStops),
			noteAfter(tokens, purposePreps, noteStops)
		])
	}
	draft.uncertain = [...uncertain]
	return draft
}
