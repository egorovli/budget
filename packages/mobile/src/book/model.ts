import type { Currency } from './money.ts'
import { convert, isCurrency, isMinor, isRate, sum } from './money.ts'

export interface Account {
	id: string
	name: string
	currency: Currency
	/** Included in Available money. */
	available: boolean
	createdAt: string
}

/** A balance that the user saw in the bank and recorded. The first one is the Opening balance. */
export interface ReportedBalance {
	id: string
	accountId: string
	amount: string
	date: string
	recordedAt: string
}

export interface ReserveUse {
	reserveId: string
	/** Amount in the Reserve currency. */
	amount: string
}

export interface Expense {
	id: string
	kind: 'expense'
	accountId: string
	/** Positive amount in the Account currency. */
	amount: string
	date: string
	note: string
	createdAt: string
	reserveUse: ReserveUse | null
}

export interface Reserve {
	id: string
	name: string
	amount: string
	currency: Currency
	dueDate: string | null
	createdAt: string
	closedAt: string | null
}

/** Current rate: base currency units for one unit of `currency`. */
export interface Rate {
	currency: Currency
	value: string
	date: string
	source: string
}

export interface Book {
	schema: 1
	id: string
	name: string
	baseCurrency: Currency
	revision: number
	accounts: Account[]
	balances: ReportedBalance[]
	transactions: Expense[]
	reserves: Reserve[]
	rates: Rate[]
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

function ensure(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message)
	}
}

export function isDate(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		datePattern.test(value) &&
		new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
	)
}

function isInstant(value: unknown): value is string {
	return typeof value === 'string' && instantPattern.test(value)
}

function isText(value: unknown): value is string {
	return typeof value === 'string' && value.trim() !== ''
}

/** The local calendar date. */
export function today(now = new Date()): string {
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const day = String(now.getDate()).padStart(2, '0')
	return `${now.getFullYear()}-${month}-${day}`
}

export function createBook(id: string): Book {
	return {
		schema: 1,
		id,
		name: 'My money',
		baseCurrency: 'PLN',
		revision: 0,
		accounts: [],
		balances: [],
		transactions: [],
		reserves: [],
		rates: []
	}
}

// Calculations

function byTime(a: ReportedBalance, b: ReportedBalance): number {
	return a.date.localeCompare(b.date) || a.recordedAt.localeCompare(b.recordedAt)
}

/**
 * An Expense is after a Reported balance when its date is later, or when it has the same date
 * and was recorded after the balance. A backdated Expense is already in the bank balance.
 */
function isAfter(expense: Expense, balance: ReportedBalance): boolean {
	return (
		expense.date > balance.date ||
		(expense.date === balance.date && expense.createdAt > balance.recordedAt)
	)
}

function expensesBetween(
	book: Book,
	accountId: string,
	from: ReportedBalance,
	to: ReportedBalance | null
): string {
	return sum(
		book.transactions
			.filter(
				item => item.accountId === accountId && isAfter(item, from) && !(to && isAfter(item, to))
			)
			.map(item => item.amount)
	)
}

export interface AccountBalance {
	/** Null when the Account has no Reported balance. */
	amount: string | null
	latest: ReportedBalance | null
	/** Unrecorded difference of the latest Reported balance; null for the Opening balance. */
	difference: string | null
}

export function accountBalance(book: Book, accountId: string): AccountBalance {
	const history = book.balances.filter(item => item.accountId === accountId).sort(byTime)
	const latest = history.at(-1)
	if (!latest) {
		return { amount: null, latest: null, difference: null }
	}
	const amount = BigInt(latest.amount) - BigInt(expensesBetween(book, accountId, latest, null))
	const previous = history.at(-2)
	let difference: string | null = null
	if (previous) {
		const expected =
			BigInt(previous.amount) - BigInt(expensesBetween(book, accountId, previous, latest))
		difference = (BigInt(latest.amount) - expected).toString()
	}
	return { amount: amount.toString(), latest, difference }
}

export function reserveRemaining(book: Book, reserve: Reserve): string {
	const used = book.transactions
		.filter(item => item.reserveUse?.reserveId === reserve.id)
		.map(item => item.reserveUse?.amount ?? '0')
	return (BigInt(reserve.amount) - BigInt(sum(used))).toString()
}

/** Converts to the base currency with the current rate. Null when the rate is unknown. */
export function toBase(book: Book, minor: string, currency: Currency): string | null {
	if (currency === book.baseCurrency) {
		return minor
	}
	const rate = book.rates.find(item => item.currency === currency)
	return rate ? convert(minor, rate.value) : null
}

export interface FreeAmount {
	available: string
	reserved: string
	free: string
	/** Accounts without a Reported balance; they are not in Available money. */
	accountsWithoutBalance: string[]
	/** Currencies without a current rate; their amounts are not in the totals. */
	currenciesWithoutRate: Currency[]
}

export function freeAmount(book: Book): FreeAmount {
	const accountsWithoutBalance: string[] = []
	const missingRates = new Set<Currency>()
	const available: string[] = []
	for (const account of book.accounts.filter(item => item.available)) {
		const { amount } = accountBalance(book, account.id)
		if (amount === null) {
			accountsWithoutBalance.push(account.id)
			continue
		}
		const converted = toBase(book, amount, account.currency)
		if (converted === null) {
			missingRates.add(account.currency)
		} else {
			available.push(converted)
		}
	}
	const reserved: string[] = []
	for (const reserve of book.reserves.filter(item => item.closedAt === null)) {
		const remaining = BigInt(reserveRemaining(book, reserve))
		// An overspent Reserve sets aside nothing more; the overspend is already in the balance.
		const converted = toBase(book, (remaining > 0n ? remaining : 0n).toString(), reserve.currency)
		if (converted === null) {
			missingRates.add(reserve.currency)
		} else {
			reserved.push(converted)
		}
	}
	const availableTotal = sum(available)
	const reservedTotal = sum(reserved)
	return {
		available: availableTotal,
		reserved: reservedTotal,
		free: (BigInt(availableTotal) - BigInt(reservedTotal)).toString(),
		accountsWithoutBalance,
		currenciesWithoutRate: [...missingRates]
	}
}

// Commands. Each command returns a new Book with the next revision, or throws a user-facing error.

function next(book: Book, change: Partial<Book>): Book {
	return validateBook({ ...book, ...change, revision: book.revision + 1 })
}

function replace<T extends { id: string }>(items: readonly T[], item: T): T[] {
	return items.some(existing => existing.id === item.id)
		? items.map(existing => (existing.id === item.id ? item : existing))
		: [...items, item]
}

export function saveAccount(book: Book, account: Account): Book {
	const existing = book.accounts.find(item => item.id === account.id)
	ensure(
		!existing || existing.currency === account.currency || !hasRecords(book, account.id),
		'The Account already has records. Its currency cannot change.'
	)
	return next(book, { accounts: replace(book.accounts, account) })
}

function hasRecords(book: Book, accountId: string): boolean {
	return (
		book.balances.some(item => item.accountId === accountId) ||
		book.transactions.some(item => item.accountId === accountId)
	)
}

export function recordBalance(book: Book, balance: ReportedBalance): Book {
	return next(book, { balances: replace(book.balances, balance) })
}

export function saveExpense(book: Book, expense: Expense): Book {
	if (expense.reserveUse) {
		const { reserveId } = expense.reserveUse
		const reserve = book.reserves.find(item => item.id === reserveId)
		const previous = book.transactions.find(item => item.id === expense.id)
		ensure(
			reserve && (reserve.closedAt === null || previous?.reserveUse?.reserveId === reserveId),
			'Select an open Reserve.'
		)
	}
	return next(book, { transactions: replace(book.transactions, expense) })
}

export function removeExpense(book: Book, id: string): Book {
	return next(book, { transactions: book.transactions.filter(item => item.id !== id) })
}

export function saveReserve(book: Book, reserve: Reserve): Book {
	const existing = book.reserves.find(item => item.id === reserve.id)
	ensure(
		!existing ||
			existing.currency === reserve.currency ||
			!book.transactions.some(item => item.reserveUse?.reserveId === reserve.id),
		'Expenses already use this Reserve. Its currency cannot change.'
	)
	return next(book, { reserves: replace(book.reserves, reserve) })
}

export function setRates(book: Book, rates: readonly Rate[]): Book {
	const updated = [...book.rates]
	for (const rate of rates) {
		const index = updated.findIndex(item => item.currency === rate.currency)
		if (index === -1) {
			updated.push(rate)
		} else {
			updated[index] = rate
		}
	}
	return next(book, { rates: updated })
}

// Validation of stored snapshots and restored files.

function records<T extends { id: string }>(
	value: unknown,
	label: string,
	check: (item: T) => boolean
): T[] {
	ensure(Array.isArray(value), `${label}: expected a list.`)
	const ids = new Set<string>()
	for (const entry of value as unknown[]) {
		ensure(entry && typeof entry === 'object', `${label}: invalid record.`)
		const item = entry as T
		ensure(isText(item.id), `${label}: invalid ID.`)
		ensure(!ids.has(item.id), `${label}: duplicate ID ${item.id}.`)
		ensure(check(item), `${label}: invalid record ${item.id}.`)
		ids.add(item.id)
	}
	return value as T[]
}

function isPositive(value: unknown): value is string {
	return isMinor(value) && BigInt(value) > 0n
}

export function validateBook(value: unknown): Book {
	ensure(value && typeof value === 'object', 'Expected a Book.')
	const book = value as Book
	ensure(book.schema === 1, 'Unsupported Book version. Keep the file and use a newer app.')
	ensure(
		isText(book.id) &&
			isText(book.name) &&
			isCurrency(book.baseCurrency) &&
			Number.isSafeInteger(book.revision) &&
			book.revision >= 0,
		'Invalid Book identity, currency or revision.'
	)
	const accounts = records<Account>(
		book.accounts,
		'Accounts',
		item =>
			isText(item.name) &&
			isCurrency(item.currency) &&
			typeof item.available === 'boolean' &&
			isInstant(item.createdAt)
	)
	const accountIds = new Set(accounts.map(item => item.id))
	records<ReportedBalance>(
		book.balances,
		'Reported balances',
		item =>
			accountIds.has(item.accountId) &&
			isMinor(item.amount) &&
			isDate(item.date) &&
			isInstant(item.recordedAt)
	)
	const reserves = records<Reserve>(
		book.reserves,
		'Reserves',
		item =>
			isText(item.name) &&
			isPositive(item.amount) &&
			isCurrency(item.currency) &&
			(item.dueDate === null || isDate(item.dueDate)) &&
			isInstant(item.createdAt) &&
			(item.closedAt === null || isInstant(item.closedAt))
	)
	const reserveIds = new Set(reserves.map(item => item.id))
	records<Expense>(
		book.transactions,
		'Expenses',
		item =>
			item.kind === 'expense' &&
			accountIds.has(item.accountId) &&
			isPositive(item.amount) &&
			isDate(item.date) &&
			typeof item.note === 'string' &&
			isInstant(item.createdAt) &&
			(item.reserveUse === null ||
				(reserveIds.has(item.reserveUse.reserveId) && isPositive(item.reserveUse.amount)))
	)
	ensure(Array.isArray(book.rates), 'Rates: expected a list.')
	const rateCurrencies = new Set<string>()
	for (const rate of book.rates) {
		ensure(
			isCurrency(rate.currency) &&
				rate.currency !== book.baseCurrency &&
				!rateCurrencies.has(rate.currency) &&
				isRate(rate.value) &&
				isDate(rate.date) &&
				isText(rate.source),
			'Rates: invalid or duplicate rate.'
		)
		rateCurrencies.add(rate.currency)
	}
	return book
}
