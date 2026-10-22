import type { Currency } from '../book/money.ts'
import { parseAmount } from '../book/money.ts'
import type { CommandDraft, CommandKind, InterpreterContext, Question } from './draft.ts'
import { emptyDraft } from './draft.ts'

// A deterministic interpreter for English, Russian and Polish sentences. It reads one
// sentence into a CommandDraft that the user then confirms on a form, or into a question
// that the app answers from the Book.

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
const amountPattern = /(?<![\p{N}.,])(\d{1,3}(?:[   ]\d{3})+|\d+)(?:[.,](\d{1,2}))?(?!\d)/gu
const ratePattern = /(?<![\d.,])(\d+(?:[.,]\d+)?)(?!\d)/u
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
	'перевел',
	'перекин',
	'переслал',
	'скинул',
	'закинул',
	'przelew',
	'przelej',
	'przelal',
	'przenie',
	'przesl'
]
const transferPhrases = ['send to my', 'sent to my']
/** Cash from an ATM: a Transfer to the cash Account. */
const withdrawStems = [
	'withdr',
	'atm',
	'снял',
	'снять',
	'сними',
	'банкомат',
	'wyplacil',
	'bankomat'
]
/** A currency exchange: a Transfer between Accounts in two currencies. */
const exchangeStems = ['exchang', 'обменя', 'обмен', 'поменял', 'wymien', 'wymian']
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
/** "на мбанке сейчас 13098,55": an Account, an amount and one of these words is a balance. */
const balanceHints = ['now', 'currently', 'сейчас', 'лежит', 'teraz', 'leży'].map(lowerOf)
/** A new Account that is not in Available money. */
const notAvailablePhrases = [
	'not count',
	'dont count',
	'don t count',
	'exclude',
	'not in available',
	'out of available',
	'не учит',
	'не считай',
	'без учет',
	'nie licz',
	'nie wliczaj'
]
const lastStems = ['last', 'previous', 'последн', 'предыдущ', 'ostatn', 'poprzedn']
const deleteStems = ['delete', 'remove', 'удали', 'убери', 'usun', 'skasuj']
const undoStems = ['undo', 'отмени', 'cofnij']
const editStems = [
	'change',
	'edit',
	'fix',
	'correct',
	'измени',
	'исправ',
	'поменяи',
	'popraw',
	'zmien'
]
const questionStarts = new Set([
	'how',
	'what',
	'whats',
	'show',
	'сколько',
	'какои',
	'какая',
	'какие',
	'каков',
	'покажи',
	'ile',
	'jaki',
	'jaka',
	'jakie',
	'pokaz'
])
const freeStems = [
	'free',
	'left',
	'money',
	'свобод',
	'остал',
	'денег',
	'деньг',
	'woln',
	'zostal',
	'pieniadz',
	'pieniedz'
]
const rateStems = ['rate', 'курс', 'kurs']
const updateStems = [
	'update',
	'refresh',
	'download',
	'обнов',
	'загрузи',
	'aktualiz',
	'odswiez',
	'pobierz'
]
const spendingStems = ['spend', 'spent', 'потрат', 'потрач', 'расход', 'wydal', 'wydatk']
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
	'new',
	'до',
	'by',
	'until',
	...balanceHints
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

/**
 * A record happened in the past; a Reserve is due in the future. A date without a year is the
 * nearest such date on that side of today.
 */
type Direction = 'past' | 'future'

function datedOn(month: number, day: number, today: string, direction: Direction): string | null {
	const [year] = parts(today)
	const date = toIso(year, month, day)
	if (date === null) {
		return null
	}
	if (direction === 'past') {
		return date <= today ? date : toIso(year - 1, month, day)
	}
	return date >= today ? date : toIso(year + 1, month, day)
}

function dayOfMonth(day: number, today: string, direction: Direction): string | null {
	const [year, month] = parts(today)
	const date = toIso(year, month, day)
	if (date !== null && (direction === 'past' ? date <= today : date >= today)) {
		return date
	}
	const first = `${year}-${String(month).padStart(2, '0')}-01`
	const other = direction === 'past' ? addDays(first, -1) : addDays(first, 32)
	const [otherYear, otherMonth] = parts(other)
	return toIso(otherYear, otherMonth, day)
}

/** The last day of a month named without a day ("by December"), on the given side of today. */
function endOfMonth(month: number, today: string, direction: Direction): string {
	const [year, current] = parts(today)
	let shift = 0
	if (direction === 'future' && month < current) {
		shift = 1
	} else if (direction === 'past' && month > current) {
		shift = -1
	}
	const next =
		month === 12
			? `${year + shift + 1}-01-01`
			: `${year + shift}-${String(month + 1).padStart(2, '0')}-01`
	return addDays(next, -1)
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

function findDate(text: string, today: string, direction: Direction = 'past'): DateMatch | null {
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
		const date = match[3]
			? toIso(Number(match[3]), month, day)
			: datedOn(month, day, today, direction)
		if (date !== null) {
			return { date, span: { start: match.index, end } }
		}
	}
	for (const match of text.matchAll(dayMonthPattern)) {
		const month = monthOf(match[2] ?? '')
		const date = month === null ? null : datedOn(month, Number(match[1]), today, direction)
		if (date !== null) {
			return { date, span: { start: match.index, end: match.index + match[0].length } }
		}
	}
	for (const match of text.matchAll(monthDayPattern)) {
		const month = monthOf(match[1] ?? '')
		const date = month === null ? null : datedOn(month, Number(match[2]), today, direction)
		if (date !== null) {
			return { date, span: { start: match.index, end: match.index + match[0].length } }
		}
	}
	if (direction === 'future') {
		for (const token of tokenize(text)) {
			const month = monthOf(token.raw)
			if (month !== null) {
				return { date: endOfMonth(month, today, direction), span: token }
			}
		}
	}
	for (const match of text.matchAll(ordinalPattern)) {
		const date = dayOfMonth(Number(match[1]), today, direction)
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

function findAmounts(text: string): AmountMatch[] {
	const found: AmountMatch[] = []
	for (const match of text.matchAll(amountPattern)) {
		const amount = amountOf(text, match)
		if (amount) {
			found.push(amount)
		}
	}
	return found
}

function amountOf(text: string, match: RegExpMatchArray): AmountMatch | null {
	const fraction = match[2]
	let amount = parseAmount(fraction ? `${match[1]}.${fraction}` : (match[1] ?? ''))
	const start = match.index ?? 0
	let end = start + match[0].length
	const half = halfPattern.exec(text.slice(end))
	if (half && amount !== null && !fraction) {
		amount = (BigInt(amount) + 50n).toString()
		end += half[0].length
	}
	if (amount === null || BigInt(amount) <= 0n) {
		return null
	}
	return { amount, span: { start, end } }
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

interface Named {
	id: string
	name: string
	currency: Currency
}

function nameWords(name: string): string[] {
	return name
		.split(spacePattern)
		.map(part => latinOf(lowerOf(part)))
		.filter(part => part !== '')
}

/** Whether the words match the tokens from `index`; null when they do not. */
function matchAt(
	tokens: readonly Token[],
	index: number,
	words: readonly string[],
	blocked: Set<number>
): { exact: boolean } | null {
	let exact = true
	const matched = words.every((word, offset) => {
		const token = tokens[index + offset]
		if (!token || blocked.has(index + offset) || token.latin === '') {
			return false
		}
		const result = wordMatch(token.latin, word)
		exact &&= result === 'exact'
		return result !== null
	})
	return matched ? { exact } : null
}

/**
 * Finds Account or Reserve names. The start of a name also matches, with a check: "Revolut"
 * matches "Revolut PLN", "ZUS" matches "ZUS and tax". When two names share the start, the one
 * in the `preferred` currency wins.
 */
function findNames(
	tokens: readonly Token[],
	items: readonly Named[],
	blocked: Set<number>,
	preferred: Currency
): NameMatch[] {
	const words = items.map(item => nameWords(item.name))
	const found: NameMatch[] = []
	for (let index = 0; index < tokens.length; index += 1) {
		const open = items
			.map((item, itemIndex) => ({ item, spelled: words[itemIndex] ?? [] }))
			.filter(
				({ item, spelled }) => spelled.length > 0 && !found.some(match => match.id === item.id)
			)
		let best: { id: string; size: number; exact: boolean } | null = null
		for (const { item, spelled } of open) {
			const full = matchAt(tokens, index, spelled, blocked)
			if (full) {
				best = { id: item.id, size: spelled.length, exact: full.exact }
				break
			}
		}
		if (!best) {
			const partial = open.flatMap(({ item, spelled }) => {
				for (let size = spelled.length - 1; size >= 1; size -= 1) {
					if (matchAt(tokens, index, spelled.slice(0, size), blocked)) {
						return [{ item, size }]
					}
				}
				return []
			})
			const chosen = partial.find(entry => entry.item.currency === preferred) ?? partial[0]
			if (chosen) {
				best = { id: chosen.item.id, size: chosen.size, exact: false }
			}
		}
		if (best) {
			const last = index + best.size - 1
			found.push({
				id: best.id,
				first: index,
				last,
				exact: best.exact,
				role: roleBefore(tokens, index)
			})
			for (let used = index; used <= last; used += 1) {
				blocked.add(used)
			}
		}
	}
	return found
}

/** Whether the sentence names the Account or Reserve, in any form that the rules accept. */
export function mentions(sentence: string, name: string): boolean {
	const first = nameWords(name).slice(0, 1)
	const tokens = tokenize(sentence)
	return tokens.some((_, index) => matchAt(tokens, index, first, new Set()) !== null)
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

interface Detected {
	kind: CommandKind
	withdrawal: boolean
	exchange: boolean
}

function has(tokens: readonly Token[], stems: readonly string[]): boolean {
	return tokens.some(token => startsWithAny(token.lower, stems))
}

function questionOf(
	tokens: readonly Token[],
	text: string,
	accounts: readonly NameMatch[]
): Question | null {
	const asks = text.includes('?') || questionStarts.has(tokens[0]?.lower ?? '')
	if (!asks) {
		return null
	}
	if (has(tokens, rateStems)) {
		return 'rate'
	}
	if (has(tokens, spendingStems)) {
		return 'spent'
	}
	if (accounts.length > 0 || has(tokens, balanceStems)) {
		return 'balance'
	}
	return has(tokens, freeStems) ? 'free' : null
}

function detectKind(
	tokens: readonly Token[],
	sentence: string,
	keywords: Set<number>,
	accounts: readonly NameMatch[],
	signals: { amount: boolean; date: boolean; question: Question | null }
): Detected {
	const plain = (kind: CommandKind): Detected => ({ kind, withdrawal: false, exchange: false })
	if (signals.question) {
		return plain('question')
	}
	if (has(tokens, rateStems)) {
		if (has(tokens, updateStems)) {
			return plain('update_rates')
		}
		if (signals.amount) {
			return plain('rate')
		}
	}
	const last = has(tokens, lastStems)
	if (has(tokens, undoStems) || (last && has(tokens, deleteStems))) {
		return plain('delete_last')
	}
	if (last && has(tokens, editStems)) {
		return plain('edit_last')
	}
	if (accountNounIndex(tokens) >= 0) {
		return plain('account')
	}
	const transfer = hasStem(tokens, transferStems, keywords)
	if (transfer || hasPhrase(sentence, transferPhrases)) {
		return plain('transfer')
	}
	if (hasStem(tokens, withdrawStems, keywords)) {
		return { kind: 'transfer', withdrawal: true, exchange: false }
	}
	if (hasStem(tokens, exchangeStems, keywords)) {
		return { kind: 'transfer', withdrawal: false, exchange: true }
	}
	if (hasStem(tokens, reserveVerbStems, keywords) || hasPhrase(sentence, reservePhrases)) {
		return plain('reserve')
	}
	if (hasStem(tokens, balanceStems, keywords)) {
		return plain('balance')
	}
	if (hasPhrase(sentence, incomePhrases) || hasStem(tokens, incomeStems, keywords)) {
		return plain('income')
	}
	if (hasStem(tokens, expenseStems, keywords)) {
		return plain('expense')
	}
	if (accounts.length >= 2 && accounts.some(match => match.role !== null)) {
		return plain('transfer')
	}
	if (hasStem(tokens, reserveNounStems, keywords)) {
		return plain('reserve')
	}
	if (last && (signals.amount || signals.date)) {
		return plain('edit_last')
	}
	if (
		signals.amount &&
		accounts.length === 1 &&
		tokens.some(token => balanceHints.includes(token.lower))
	) {
		return plain('balance')
	}
	return plain(signals.amount ? 'expense' : 'unknown')
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

/** Another Account with the same first word in the given currency ("Revolut EUR" for "Revolut PLN"). */
function sibling(
	accounts: readonly Named[],
	id: string | null,
	currency: Currency | null
): Named | undefined {
	const account = accounts.find(item => item.id === id)
	if (!(account && currency) || account.currency === currency) {
		return account
	}
	const first = nameWords(account.name)[0]
	return accounts.find(item => item.currency === currency && nameWords(item.name)[0] === first)
}

function addMonths(iso: string, count: number): string {
	const [year, month] = parts(iso)
	const total = year * 12 + month - 1 + count
	return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-01`
}

const periodWords = new Set([
	'this',
	'last',
	'month',
	'week',
	'этом',
	'этои',
	'прошлом',
	'месяце',
	'неделе',
	'tym',
	'zeszlym',
	'ostatnim',
	'miesiacu',
	'tygodniu'
])

/** The days that a spending question covers. The current month when the sentence names none. */
function periodOf(tokens: readonly Token[], sentence: string, today: string) {
	const first = `${today.slice(0, 8)}01`
	for (const [word, days] of Object.entries(dateWords)) {
		if (sentence.includes(` ${word} `)) {
			const date = addDays(today, days)
			return { from: date, to: date }
		}
	}
	if (has(tokens, ['week', 'недел', 'tydzien', 'tygodn'])) {
		return { from: addDays(today, -6), to: today }
	}
	if (has(tokens, ['прошл', 'zeszl', 'poprzedn']) || sentence.includes(' last month ')) {
		const from = addMonths(first, -1)
		return { from, to: addDays(first, -1) }
	}
	for (const token of tokens) {
		const month = monthOf(token.raw)
		if (month !== null) {
			const to = endOfMonth(month, today, 'past')
			return { from: `${to.slice(0, 8)}01`, to: to > today ? today : to }
		}
	}
	return { from: first, to: today }
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
	const amounts = findAmounts(working)
	const amount = amounts[0] ?? null
	const spans: Span[] = []
	if (date) {
		spans.push(date.span)
	}
	for (const found of amounts) {
		spans.push(found.span)
	}
	if (amount) {
		draft.amount = amount.amount
	}

	const tokens = tokenize(text)
	const sentence = ` ${tokens.map(token => token.lower).join(' ')} `
	// Amounts, dates and currency words are not notes. Currency words can still be part of a
	// name ("Revolut PLN"), so names see only the amount and date tokens as blocked.
	const stopped = new Set<number>()
	const nameBlocked = new Set<number>()
	const currencyAt = new Map<number, Currency>()
	for (const [index, token] of tokens.entries()) {
		if (spans.some(span => token.start < span.end && token.end > span.start)) {
			stopped.add(index)
			nameBlocked.add(index)
			const glued = currencyOf(token)
			if (glued !== null) {
				currencyAt.set(index, glued)
			}
			continue
		}
		const currency = currencyOf(token)
		if (currency !== null) {
			currencyAt.set(index, currency)
			stopped.add(index)
		}
		const shift = dateWords[token.lower]
		if (shift !== undefined) {
			stopped.add(index)
			nameBlocked.add(index)
			if (draft.date === null) {
				const before = sentence.includes(' day before yesterday ') ? -2 : shift
				draft.date = addDays(context.today, before)
			}
		}
	}

	const spoken = [...currencyAt.values()]
	const preferred = spoken[0] ?? context.baseCurrency
	const keywords = new Set<number>()
	const accountBlocked = new Set(nameBlocked)
	const accountMatches = findNames(tokens, context.accounts, accountBlocked, preferred)
	// The currency is the first currency word that is not part of an Account name.
	const inName = (index: number) =>
		accountMatches.some(match => index >= match.first && index <= match.last)
	const currencies = [...currencyAt.entries()].filter(([index]) => !inName(index))
	draft.currency = currencies[0]?.[1] ?? null

	const question = questionOf(tokens, text, accountMatches)
	const detected = detectKind(tokens, sentence, keywords, accountMatches, {
		amount: amount !== null,
		date: draft.date !== null,
		question
	})
	const kind = detected.kind
	draft.kind = kind

	if (kind === 'question') {
		draft.question = question
		setName(draft, 'accountId', accountMatches[0], uncertain)
		if (question === 'spent') {
			draft.period = periodOf(tokens, sentence, context.today)
			const periodTokens = tokens.flatMap((token, index) =>
				monthOf(token.raw) !== null || periodWords.has(token.lower) ? [index] : []
			)
			draft.note = noteAfter(
				tokens,
				merchantPreps,
				new Set([...stopped, ...accountBlocked, ...periodTokens])
			)
		}
		draft.date = null
		draft.amount = null
		return draft
	}
	if (kind === 'rate') {
		const number = ratePattern.exec(text)?.[1]
		draft.rate = number ? number.replace(',', '.') : null
		draft.amount = null
		return draft
	}
	if (kind === 'update_rates' || kind === 'delete_last') {
		draft.amount = null
		draft.currency = null
		draft.date = null
		return draft
	}
	if (kind === 'edit_last') {
		return draft
	}

	if (kind === 'account') {
		const noun = accountNounIndex(tokens)
		const blocked = new Set([...stopped, noun])
		const name = collectWords(tokens, noun + 1, blocked)
		draft.note = name === '' ? null : name
		if (notAvailablePhrases.some(phrase => sentence.includes(` ${phrase}`))) {
			draft.available = false
		}
		draft.uncertain = [...uncertain]
		return draft
	}

	if (kind === 'reserve' && date) {
		// "до 10 ноября" is a due date, so a date without a year is the next one.
		draft.date = findDate(text, context.today, 'future')?.date ?? draft.date
	} else if (kind === 'reserve') {
		draft.date = findDate(text, context.today, 'future')?.date ?? null
	}

	const reserveBlocked = new Set(accountBlocked)
	const reserveMatches = findNames(tokens, context.reserves, reserveBlocked, preferred)
	setName(draft, 'reserveId', reserveMatches[0], uncertain)

	if (kind === 'transfer' && detected.withdrawal) {
		const cash = context.accounts.find(account =>
			nameWords(account.name).some(word => startsWithAny(word, cashStems))
		)
		const target = accountMatches.find(match => match.id === cash?.id)
		const source = accountMatches.find(match => match !== target)
		setName(draft, 'accountId', source, uncertain)
		if (target) {
			setName(draft, 'toAccountId', target, uncertain)
		} else if (cash) {
			draft.toAccountId = cash.id
			uncertain.add('toAccountId')
		}
	} else if (kind === 'transfer' && detected.exchange) {
		// "exchanged 430 zł to 98.50 euro on Revolut": the first amount and currency leave,
		// the second arrive, on the Accounts of that bank in each currency.
		const [sent, got] = currencies.map(([, currency]) => currency)
		const named = accountMatches.find(match => match.role !== 'to') ?? accountMatches[0]
		const to = accountMatches.find(match => match.role === 'to' && match !== named)
		const source = sibling(context.accounts, named?.id ?? null, sent ?? null)
		const target = to
			? context.accounts.find(item => item.id === to.id)
			: sibling(context.accounts, named?.id ?? null, got ?? null)
		draft.accountId = source?.id ?? null
		draft.toAccountId = target && target.id !== source?.id ? target.id : null
		draft.received = amounts[1]?.amount ?? null
		for (const field of ['accountId', 'toAccountId'] as const) {
			if (draft[field] !== null) {
				uncertain.add(field)
			}
		}
	} else if (kind === 'transfer') {
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
		...stopped,
		...(kind === 'reserve' ? accountBlocked : reserveBlocked),
		...keywords
	])
	if (kind === 'balance') {
		draft.note = null
	} else if (kind === 'reserve') {
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

/** Russian and Polish spellings of one sound, so "жабке" and "Żabce" give one key. */
function soundKey(latin: string): string {
	return latin
		.replace(/zh|rz/g, 'z')
		.replace(/sz|sh|sch/g, 's')
		.replace(/cz|ch|ts/g, 'c')
		.replace(/[yj]/g, 'i')
		.slice(0, 4)
}

/** Whether a record note names the merchant of a question, in any of the three languages. */
export function sameMerchant(note: string, merchant: string): boolean {
	const wanted = tokenize(merchant).map(token => soundKey(token.latin))[0]
	if (!wanted || wanted.length < 3) {
		return false
	}
	return tokenize(note).some(token => soundKey(token.latin) === wanted)
}
