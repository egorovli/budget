export const currencies = ['PLN', 'EUR', 'USD', 'RUB', 'AMD'] as const
export type Currency = (typeof currencies)[number]
export interface Account {
	id: string
	bookId: string
	name: string
	currency: Currency
	opening: string | null
	openingDate: string
}
export interface Category {
	id: string
	bookId: string
	name: string
	parentId: string | null
}
export interface Counterparty {
	id: string
	bookId: string
	name: string
}
export interface Rate {
	from: Currency
	to: Currency
	value: string
	date?: string
	provenance: string
}
export interface ExpenseLocation {
	latitude: number
	longitude: number
	simulated: boolean
	measuredAt?: string
	accuracy?: number
}
export interface PendingDraft {
	eventId: string
	amount: string
	currency: Currency
	accountId: string | null
	date: string
	note: string
	original?: { amount: string; currency: Currency }
}
export interface Transaction {
	eventId?: string
	location?: ExpenseLocation
	id: string
	bookId: string
	accountId: string
	type: 'Expense' | 'Income'
	amount: string
	date: string
	categoryId: string | null
	counterpartyId: string | null
	note: string
	original?: { amount: string; currency: Currency }
	rate?: Rate
	occurredAt?: string
}
export interface Transfer {
	id: string
	bookId: string
	fromId: string
	toId: string
	sent: string
	received: string
	date: string
	note: string
}
export interface Book {
	pending?: PendingDraft[]
	seenEvents?: string[]
	transfers?: Transfer[]
	schema: 1
	revision: number
	id: string
	name: string
	baseCurrency: Currency
	accounts: Account[]
	transactions: Transaction[]
	categories: Category[]
	counterparties: Counterparty[]
}
const amountPattern = /^[-+]?\d+(\.\d{1,2})?$/
const signPattern = /^[-+]/
export function parseAmount(value: string, currency: Currency): string {
	if (!amountPattern.test(value.trim())) {
		throw new Error(`Use at most two decimal places for ${currency}.`)
	}
	const negative = value.trim().startsWith('-')
	const [whole = '0', fraction = ''] = value.trim().replace(signPattern, '').split('.')
	return (
		(negative ? -1n : 1n) *
		(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')))
	).toString()
}
export function formatAmount(value: string, currency: Currency): string {
	const minor = BigInt(value)
	const absolute = minor < 0n ? -minor : minor
	return `${minor < 0n ? '-' : ''}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')} ${currency}`
}
export function balance(book: Book, accountId: string): string {
	const account = book.accounts.find(item => item.id === accountId)
	if (!account) {
		throw new Error('Account not found.')
	}
	let amount = BigInt(account.opening ?? '0')
	for (const transaction of book.transactions) {
		if (transaction.accountId === accountId) {
			amount += BigInt(transaction.amount) * (transaction.type === 'Income' ? 1n : -1n)
		}
	}
	for (const transfer of book.transfers ?? []) {
		if (transfer.fromId === accountId) {
			amount -= BigInt(transfer.sent)
		}
		if (transfer.toId === accountId) {
			amount += BigInt(transfer.received)
		}
	}

	return amount.toString()
}
export const demo: Book = {
	schema: 1,
	revision: 0,
	id: 'family',
	name: 'Sample Book',
	baseCurrency: 'PLN',
	accounts: [
		{
			id: 'mbank',
			bookId: 'family',
			name: 'Sample PLN',
			currency: 'PLN',
			opening: '100000',
			openingDate: '2026-10-01'
		},
		{
			id: 'revolut',
			bookId: 'family',
			name: 'Sample EUR',
			currency: 'EUR',
			opening: '20000',
			openingDate: '2026-10-01'
		}
	],
	categories: [
		{ id: 'food', bookId: 'family', name: 'Food', parentId: null },
		{ id: 'groceries', bookId: 'family', name: 'Groceries', parentId: 'food' },
		{ id: 'salary', bookId: 'family', name: 'Salary', parentId: null }
	],
	counterparties: [
		{ id: 'shop', bookId: 'family', name: 'Sample shop' },
		{ id: 'employer', bookId: 'family', name: 'Sample employer' }
	],
	transactions: [
		{
			id: 'groceries',
			bookId: 'family',
			accountId: 'mbank',
			type: 'Expense',
			amount: '1234',
			date: '2026-10-02',
			categoryId: 'groceries',
			counterpartyId: 'shop',
			note: 'Synthetic groceries'
		},
		{
			id: 'salary',
			bookId: 'family',
			accountId: 'mbank',
			type: 'Income',
			amount: '10000',
			date: '2026-10-03',
			categoryId: 'salary',
			counterpartyId: 'employer',
			note: 'Synthetic income'
		},
		{
			id: 'eur-purchase',
			bookId: 'family',
			accountId: 'revolut',
			type: 'Expense',
			amount: '1000',
			date: '2026-10-04',
			categoryId: 'food',
			counterpartyId: null,
			note: 'Synthetic purchase'
		}
	]
}

const integerPattern = /^-?(0|[1-9]\d*)$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const decimalPattern = /^\d+(\.\d+)?$/
const nonZeroPattern = /[1-9]/
const instantPattern = /T.*(Z|[+-]\d{2}:\d{2})$/
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
export function requireValue(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message)
	}
}
export function isCurrency(value: unknown): value is Currency {
	return currencies.some(currency => currency === value)
}
export function isDate(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		datePattern.test(value) &&
		Number.isFinite(Date.parse(value)) &&
		new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
	)
}
function isMinor(value: unknown): value is string {
	return typeof value === 'string' && integerPattern.test(value)
}
function namedRecords(value: unknown, bookId: string, label: string) {
	requireValue(Array.isArray(value), `${label} must be a list.`)
	const ids = new Set<string>()
	for (const record of value) {
		requireValue(record && typeof record === 'object', `${label}: invalid record.`)
		const item = record as { id: string; bookId: string; name: string }
		requireValue(
			typeof item.id === 'string' &&
				item.id.trim() &&
				item.bookId === bookId &&
				typeof item.name === 'string' &&
				item.name.trim(),
			`${label}: invalid ID, Book or name.`
		)
		requireValue(!ids.has(item.id), `${label}: duplicate ID ${item.id}.`)
		ids.add(item.id)
	}
}
export function validateBook(value: unknown): Book {
	requireValue(value && typeof value === 'object', 'Expected a Book snapshot.')
	const book = value as Book
	requireValue(
		book.schema === 1,
		'Unsupported Book schema. Keep the file and use a compatible version.'
	)
	requireValue(
		Number.isSafeInteger(book.revision) &&
			book.revision >= 0 &&
			typeof book.id === 'string' &&
			book.id.trim() &&
			typeof book.name === 'string' &&
			book.name.trim() &&
			isCurrency(book.baseCurrency),
		'Invalid Book identity, currency or revision.'
	)
	namedRecords(book.accounts, book.id, 'Accounts')
	namedRecords(book.categories, book.id, 'Categories')
	namedRecords(book.counterparties, book.id, 'Counterparties')
	for (const account of book.accounts) {
		requireValue(
			isCurrency(account.currency) &&
				(account.opening === null || isMinor(account.opening)) &&
				isDate(account.openingDate),
			`Account ${account.id}: invalid currency, Opening balance or date.`
		)
	}
	for (const category of book.categories) {
		requireValue(
			category.parentId === null || book.categories.some(parent => parent.id === category.parentId),
			`Category ${category.id}: parent not found in this Book.`
		)
		const visited = new Set<string>()
		let current: Category | undefined = category
		while (current) {
			requireValue(!visited.has(current.id), 'Category hierarchy contains a cycle.')
			visited.add(current.id)
			current = book.categories.find(parent => parent.id === current?.parentId)
		}
	}
	requireValue(Array.isArray(book.transactions), 'Transactions must be a list.')
	const ids = new Set<string>()
	for (const transaction of book.transactions) {
		requireValue(
			transaction &&
				typeof transaction === 'object' &&
				typeof transaction.id === 'string' &&
				transaction.id.trim() &&
				!ids.has(transaction.id) &&
				transaction.bookId === book.id,
			'Transaction: invalid or duplicate ID or Book.'
		)
		ids.add(transaction.id)
		const account = book.accounts.find(item => item.id === transaction.accountId)
		requireValue(account, `Transaction ${transaction.id}: Account not found.`)
		requireValue(
			(transaction.type === 'Expense' || transaction.type === 'Income') &&
				isMinor(transaction.amount) &&
				BigInt(transaction.amount) > 0n &&
				isDate(transaction.date) &&
				typeof transaction.note === 'string',
			`Transaction ${transaction.id}: invalid type, positive Posted amount, date or note.`
		)
		requireValue(
			transaction.date >= account.openingDate,
			'Transaction date must be on or after the Opening balance date.'
		)
		requireValue(
			transaction.categoryId === null ||
				book.categories.some(item => item.id === transaction.categoryId),
			'Category not found in this Book.'
		)
		requireValue(
			transaction.counterpartyId === null ||
				book.counterparties.some(item => item.id === transaction.counterpartyId),
			'Counterparty not found in this Book.'
		)
		if (transaction.original !== undefined) {
			requireValue(
				transaction.original &&
					isCurrency(transaction.original.currency) &&
					isMinor(transaction.original.amount) &&
					BigInt(transaction.original.amount) > 0n,
				'Invalid Original amount or currency.'
			)
		}
		if (transaction.rate !== undefined) {
			const rate = transaction.rate
			requireValue(
				rate &&
					isCurrency(rate.from) &&
					isCurrency(rate.to) &&
					rate.from !== rate.to &&
					typeof rate.value === 'string' &&
					decimalPattern.test(rate.value) &&
					nonZeroPattern.test(rate.value) &&
					typeof rate.provenance === 'string' &&
					rate.provenance.trim() &&
					(rate.date === undefined || isDate(rate.date)),
				'Invalid rate direction, decimal value or provenance.'
			)
		}
		if (transaction.occurredAt !== undefined) {
			requireValue(
				typeof transaction.occurredAt === 'string' &&
					instantPattern.test(transaction.occurredAt) &&
					Number.isFinite(Date.parse(transaction.occurredAt)),
				'Occurrence time needs a known offset.'
			)
			requireValue(
				transaction.occurredAt.slice(0, 10) === transaction.date,
				'Occurrence time must fall on the Transaction date.'
			)
		}
	}
	requireValue(
		book.transfers === undefined || Array.isArray(book.transfers),
		'Transfers must be a list.'
	)
	for (const transfer of book.transfers ?? []) {
		requireValue(
			transfer &&
				typeof transfer.id === 'string' &&
				transfer.id.trim() &&
				!ids.has(transfer.id) &&
				transfer.bookId === book.id,
			'Transfer: invalid or duplicate ID or Book.'
		)
		ids.add(transfer.id)
		const from = book.accounts.find(item => item.id === transfer.fromId)
		const to = book.accounts.find(item => item.id === transfer.toId)
		requireValue(from && to && from.id !== to.id, 'Choose two distinct Accounts in this Book.')
		requireValue(
			isMinor(transfer.sent) &&
				BigInt(transfer.sent) > 0n &&
				isMinor(transfer.received) &&
				BigInt(transfer.received) > 0n &&
				isDate(transfer.date) &&
				typeof transfer.note === 'string',
			'Transfer: invalid positive amounts, date or note.'
		)
		requireValue(
			transfer.date >= from.openingDate && transfer.date >= to.openingDate,
			'Transfer date must be on or after both Opening dates.'
		)
		requireValue(
			from.currency !== to.currency || transfer.sent === transfer.received,
			'Same-currency Transfer amounts must match.'
		)
	}

	requireValue(
		book.pending === undefined || Array.isArray(book.pending),
		'Pending drafts must be a list.'
	)
	requireValue(
		book.seenEvents === undefined ||
			(Array.isArray(book.seenEvents) &&
				book.seenEvents.every(id => typeof id === 'string' && id.trim()) &&
				new Set(book.seenEvents).size === book.seenEvents.length),
		'Invalid capture event IDs.'
	)
	const events = new Set<string>()
	for (const transaction of book.transactions) {
		if (transaction.eventId !== undefined) {
			requireValue(
				typeof transaction.eventId === 'string' &&
					!events.has(transaction.eventId) &&
					book.seenEvents?.includes(transaction.eventId),
				'Capture event is invalid or already saved.'
			)
			events.add(transaction.eventId)
		}
		if (transaction.location !== undefined) {
			const point = transaction.location
			requireValue(
				transaction.type === 'Expense' &&
					point &&
					Number.isFinite(point.latitude) &&
					Math.abs(point.latitude) <= 90 &&
					Number.isFinite(point.longitude) &&
					Math.abs(point.longitude) <= 180 &&
					typeof point.simulated === 'boolean',
				'Expense location: invalid coordinates, consent marker or Transaction type.'
			)
			requireValue(
				point.accuracy === undefined || (Number.isFinite(point.accuracy) && point.accuracy >= 0),
				'Location accuracy must be nonnegative.'
			)
			requireValue(
				point.measuredAt === undefined ||
					(typeof point.measuredAt === 'string' &&
						instantPattern.test(point.measuredAt) &&
						Number.isFinite(Date.parse(point.measuredAt))),
				'Location measurement time needs an offset.'
			)
		}
	}
	for (const draft of book.pending ?? []) {
		requireValue(
			draft &&
				typeof draft.eventId === 'string' &&
				book.seenEvents?.includes(draft.eventId) &&
				!events.has(draft.eventId) &&
				isMinor(draft.amount) &&
				BigInt(draft.amount) > 0n &&
				isCurrency(draft.currency) &&
				isDate(draft.date) &&
				typeof draft.note === 'string',
			'Invalid or duplicate pending capture draft.'
		)
		events.add(draft.eventId)
		requireValue(
			draft.accountId === null || book.accounts.some(item => item.id === draft.accountId),
			'Capture Account not found.'
		)
		if (draft.original !== undefined) {
			requireValue(
				draft.original &&
					isCurrency(draft.original.currency) &&
					isMinor(draft.original.amount) &&
					BigInt(draft.original.amount) > 0n,
				'Invalid capture Original amount.'
			)
		}
	}

	return book
}
export function saveTransaction(
	book: Book,
	transaction: Transaction,
	reviewedCurrency = false
): Book {
	const old = book.transactions.find(item => item.id === transaction.id)
	const oldCurrency = book.accounts.find(item => item.id === old?.accountId)?.currency
	const newCurrency = book.accounts.find(item => item.id === transaction.accountId)?.currency
	requireValue(
		!old || oldCurrency === newCurrency || reviewedCurrency,
		'Please review the Posted amount in the destination currency.'
	)
	if (transaction.eventId) {
		const draft = book.pending?.find(item => item.eventId === transaction.eventId)
		requireValue(
			old?.eventId === transaction.eventId || draft,
			'Capture event is already saved or dismissed.'
		)
		requireValue(
			!book.transactions.some(
				item => item.eventId === transaction.eventId && item.id !== transaction.id
			),
			'Capture event is already saved.'
		)
		requireValue(
			!draft || draft.currency === newCurrency || reviewedCurrency,
			'Please review the captured Posted amount in the destination currency.'
		)
	}

	const next = {
		...book,
		transactions: [...book.transactions.filter(item => item.id !== transaction.id), transaction],
		pending: (book.pending ?? []).filter(item => item.eventId !== transaction.eventId)
	}
	return validateBook(next)
}
export function removeTransaction(book: Book, id: string): Book {
	return validateBook({ ...book, transactions: book.transactions.filter(item => item.id !== id) })
}
export function saveAccount(book: Book, account: Account, confirmedOpening = false): Book {
	const old = book.accounts.find(item => item.id === account.id)
	requireValue(
		!old ||
			old.currency === account.currency ||
			(!book.transactions.some(item => item.accountId === old.id) &&
				!(book.transfers ?? []).some(item => item.fromId === old.id || item.toId === old.id)),
		'Account currency is fixed after activity exists.'
	)
	requireValue(
		!old ||
			(old.opening === account.opening && old.openingDate === account.openingDate) ||
			confirmedOpening,
		'Confirm the Opening balance correction.'
	)
	return validateBook({
		...book,
		accounts: [...book.accounts.filter(item => item.id !== account.id), account]
	})
}
export function today(days = 0): string {
	const now = new Date()
	now.setDate(now.getDate() + days)
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function nowTime(): string {
	const now = new Date()
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
export function localInstant(date: string, time: string): string {
	requireValue(isDate(date) && timePattern.test(time), 'Enter the time as HH:MM.')
	const offset = -new Date(`${date}T${time}:00`).getTimezoneOffset()
	const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
	const minutes = String(Math.abs(offset) % 60).padStart(2, '0')
	return `${date}T${time}:00${offset < 0 ? '-' : '+'}${hours}:${minutes}`
}
export function newestFirst(
	a: { id: string; date: string; occurredAt?: string | undefined },
	b: { id: string; date: string; occurredAt?: string | undefined }
): number {
	const time = (item: { occurredAt?: string | undefined }) =>
		item.occurredAt ? Date.parse(item.occurredAt) : Number.NEGATIVE_INFINITY
	return b.date.localeCompare(a.date) || Math.sign(time(b) - time(a)) || a.id.localeCompare(b.id)
}

export function saveTransfer(book: Book, transfer: Transfer): Book {
	return validateBook({
		...book,
		transfers: [...(book.transfers ?? []).filter(item => item.id !== transfer.id), transfer]
	})
}
export function removeTransfer(book: Book, id: string): Book {
	return validateBook({ ...book, transfers: (book.transfers ?? []).filter(item => item.id !== id) })
}
export function saveCategory(book: Book, category: Category): Book {
	return validateBook({
		...book,
		categories: [...book.categories.filter(item => item.id !== category.id), category]
	})
}
export function saveCounterparty(book: Book, counterparty: Counterparty): Book {
	return validateBook({
		...book,
		counterparties: [
			...book.counterparties.filter(item => item.id !== counterparty.id),
			counterparty
		]
	})
}
export function categoryPath(book: Book, id: string): string {
	const names: string[] = []
	const categories = new Map(book.categories.map(item => [item.id, item]))
	let current = categories.get(id)
	while (current) {
		names.push(current.name)
		current = current.parentId ? categories.get(current.parentId) : undefined
	}
	return names.reverse().join(' › ')
}
export function descendants(book: Book, id: string): Set<string> {
	const result = new Set([id])
	const children = new Map<string, string[]>()
	for (const category of book.categories) {
		if (category.parentId) {
			children.set(category.parentId, [...(children.get(category.parentId) ?? []), category.id])
		}
	}
	const pending = [id]
	while (pending.length) {
		for (const child of children.get(pending.pop() ?? '') ?? []) {
			if (!result.has(child)) {
				result.add(child)
				pending.push(child)
			}
		}
	}
	return result
}
export interface ActivityFilter {
	accountId?: string
	categoryId?: string
	counterpartyId?: string
	from?: string
	to?: string
	text?: string
}
export function filterTransactions(book: Book, filter: ActivityFilter): Transaction[] {
	const categoryIds = filter.categoryId ? descendants(book, filter.categoryId) : null
	return book.transactions
		.filter(item => {
			const account = book.accounts.find(record => record.id === item.accountId)
			const party = book.counterparties.find(record => record.id === item.counterpartyId)
			const text =
				`${item.type} ${item.note} ${account?.name ?? ''} ${party?.name ?? ''} ${categoryPath(book, item.categoryId ?? '')} ${formatAmount(item.amount, account?.currency ?? 'PLN')}`.toLowerCase()
			return (
				(!filter.accountId || item.accountId === filter.accountId) &&
				(!categoryIds || categoryIds.has(item.categoryId ?? '')) &&
				(!filter.counterpartyId || item.counterpartyId === filter.counterpartyId) &&
				(!filter.from || item.date >= filter.from) &&
				(!filter.to || item.date <= filter.to) &&
				(!filter.text || text.includes(filter.text.toLowerCase()))
			)
		})
		.sort(newestFirst)
}
export interface CounterpartyHistory {
	count: number
	low: string
	high: string
	last: Transaction
	categoryId: string | null
}
export function counterpartyHistory(
	book: Book,
	query: {
		counterpartyId: string
		accountId: string
		type: Transaction['type']
		excludeId?: string
	}
): CounterpartyHistory | null {
	const currency = (id: string) => book.accounts.find(account => account.id === id)?.currency
	const records = book.transactions
		.filter(
			item =>
				item.counterpartyId === query.counterpartyId &&
				item.type === query.type &&
				item.id !== query.excludeId &&
				currency(item.accountId) === currency(query.accountId)
		)
		.sort(newestFirst)
	const last = records[0]
	if (!last) {
		return null
	}
	const amounts = records
		.map(item => BigInt(item.amount))
		.sort((a, b) => Number(a > b) - Number(a < b))
	const counts = new Map<string, number>()
	for (const item of records) {
		if (item.categoryId) {
			counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1)
		}
	}
	let categoryId: string | null = null
	for (const [id, count] of counts) {
		if (count > (counts.get(categoryId ?? '') ?? 0)) {
			categoryId = id
		}
	}
	return {
		count: records.length,
		low: String(amounts[Math.floor((amounts.length - 1) / 4)]),
		high: String(amounts[Math.ceil((3 * (amounts.length - 1)) / 4)]),
		last,
		categoryId
	}
}
export function impliedRate(sent: string, received: string): string {
	const scaled = (BigInt(received) * 10000n) / BigInt(sent)
	return `${scaled / 10000n}.${(scaled % 10000n).toString().padStart(4, '0')}`
}
export function spending(
	transactions: Transaction[],
	book: Book
): { totals: Partial<Record<Currency, string>>; base: string | null; missing: number } {
	const totals: Partial<Record<Currency, string>> = {}
	let base = 0n
	const missing: string[] = []
	for (const transaction of transactions) {
		if (transaction.type !== 'Expense') {
			continue
		}
		const currency = book.accounts.find(account => account.id === transaction.accountId)?.currency
		if (!currency) {
			continue
		}
		totals[currency] = (BigInt(totals[currency] ?? '0') + BigInt(transaction.amount)).toString()
		if (currency === book.baseCurrency) {
			base += BigInt(transaction.amount)
			continue
		}
		const rate = transaction.rate
		if (!rate || rate.from !== currency || rate.to !== book.baseCurrency) {
			missing.push(transaction.id)
			continue
		}
		const [whole = '0', fraction = ''] = rate.value.split('.')
		const denominator = 10n ** BigInt(fraction.length)
		const numerator = BigInt(whole + fraction)
		base += (BigInt(transaction.amount) * numerator + denominator / 2n) / denominator
	}
	return { totals, base: missing.length > 0 ? null : base.toString(), missing: missing.length }
}

export function simulate(book: Book, example: 'ordinary' | 'foreign' | 'incomplete'): Book {
	const eventId = `synthetic-${example}-1`
	if (book.seenEvents?.includes(eventId)) {
		return book
	}
	const account = book.accounts.find(item => item.currency === 'PLN')
	const draft: PendingDraft = {
		eventId,
		amount: example === 'foreign' ? '4321' : '1234',
		currency: 'PLN',
		accountId: example === 'incomplete' ? null : (account?.id ?? null),
		date: today(),
		note: `Synthetic ${example} purchase`
	}
	if (example === 'foreign') {
		draft.original = { amount: '1000', currency: 'EUR' }
	}
	return validateBook({
		...book,
		pending: [...(book.pending ?? []), draft],
		seenEvents: [...(book.seenEvents ?? []), eventId]
	})
}
export function dismissCapture(book: Book, eventId: string): Book {
	return validateBook({
		...book,
		pending: (book.pending ?? []).filter(item => item.eventId !== eventId)
	})
}
