import { expect, test } from 'bun:test'
import {
	balance,
	demo,
	formatAmount,
	parseAmount,
	saveTransaction,
	saveTransfer,
	simulate,
	dismissCapture,
	categoryPath,
	filterTransactions,
	saveCategory,
	saveAccount,
	validateBook,
	removeTransfer,
	spending,
	removeTransaction,
	localInstant,
	counterpartyHistory
} from '../src/book/model.ts'
const localInstantPattern = /^2026-10-05T08:15:00[+-]\d{2}:\d{2}$/

test('sample balances come from exact opening balances and activity', () => {
	expect(formatAmount(balance(demo, 'mbank'), 'PLN')).toBe('1087.66 PLN')
	expect(formatAmount(balance(demo, 'revolut'), 'EUR')).toBe('190.00 EUR')
	expect(parseAmount('12.34', 'PLN')).toBe('1234')
	expect(() => parseAmount('12.345', 'PLN')).toThrow()
})

test('Expense commands preserve exact balances across create, edit, move and remove', () => {
	const initial = structuredClone(demo)
	initial.transactions = []
	const expense = { ...demo.transactions[0], id: 'manual', amount: '1234' }
	const created = saveTransaction(initial, expense)
	expect(balance(created, 'mbank')).toBe('98766')
	const edited = saveTransaction(created, { ...expense, amount: '2000' })
	expect(balance(edited, 'mbank')).toBe('98000')
	expect(balance(removeTransaction(edited, 'manual'), 'mbank')).toBe('100000')
	expect(() => saveTransaction(edited, { ...expense, accountId: 'revolut' })).toThrow('review')
	const moved = saveTransaction(edited, { ...expense, accountId: 'revolut' }, true)
	expect(balance(moved, 'mbank')).toBe('100000')
	expect(balance(moved, 'revolut')).toBe('18766')
})

test('one Transfer changes two Accounts without adding spending or income', () => {
	const book = { ...structuredClone(demo), transactions: [] }
	const transfer = {
		id: 'fx',
		bookId: book.id,
		fromId: 'revolut',
		toId: 'mbank',
		sent: '10000',
		received: '42500',
		date: '2026-10-08',
		note: ''
	}
	const next = saveTransfer(book, transfer)
	expect(balance(next, 'revolut')).toBe('10000')
	expect(balance(next, 'mbank')).toBe('142500')
	expect(spending(next.transactions, next).totals).toEqual({})
	expect(balance(removeTransfer(next, 'fx'), 'mbank')).toBe('100000')
})

test('deep Category paths select parents and reject cycles without changing money', () => {
	const book = structuredClone(demo)
	book.categories = Array.from({ length: 120 }, (_, index) => ({
		id: `c${index}`,
		bookId: book.id,
		name: `Level ${index}`,
		parentId: index ? `c${index - 1}` : null
	}))
	book.transactions = [
		{ ...demo.transactions[0], categoryId: 'c0' },
		{ ...demo.transactions[0], id: 'child', categoryId: 'c119', amount: '1000' }
	]
	expect(categoryPath(book, 'c119')).toContain('Level 0 › Level 1')
	expect(filterTransactions(book, { categoryId: 'c0' })).toHaveLength(2)
	expect(spending(filterTransactions(book, { categoryId: 'c0' }), book).totals.PLN).toBe('2234')
	expect(() => saveCategory(book, { ...book.categories[0], parentId: 'c119' })).toThrow('cycle')
	const edited = saveTransaction(book, { ...book.transactions[1], categoryId: null })
	expect(balance(edited, 'mbank')).toBe(balance(book, 'mbank'))
})
test('Original amount and rate survive Category edits and unknown Opening balance stays unknown', () => {
	const purchase = {
		...demo.transactions[0],
		amount: '4321',
		original: { amount: '1000', currency: 'EUR' },
		rate: { from: 'EUR', to: 'PLN', value: '4.321', provenance: 'recorded' }
	}
	const book = saveTransaction(demo, purchase)
	expect(
		saveTransaction(book, { ...purchase, categoryId: null }).transactions.find(
			item => item.id === purchase.id
		)?.original
	).toEqual({ amount: '1000', currency: 'EUR' })
	expect(() => saveAccount(book, { ...book.accounts[0], currency: 'EUR' })).toThrow('currency')
	expect(() => saveTransaction(book, { ...purchase, date: '2026-09-30' })).toThrow('Opening')
	expect(() =>
		validateBook({ ...book, transactions: [{ ...purchase, date: '2026-02-30' }] })
	).toThrow()
})

test('Income affects the balance but not spending; missing conversions stay explicit', () => {
	const income = { ...demo.transactions[0], id: 'income-new', type: 'Income', amount: '10000' }
	const next = saveTransaction(demo, income)
	expect(balance(next, 'mbank')).toBe('118766')
	expect(spending(next.transactions, next).totals.PLN).toBe('1234')
	expect(spending(next.transactions, next).missing).toBe(1)
	expect(spending(next.transactions, next).base).toBeNull()
	const converted = saveTransaction(next, {
		...next.transactions.find(item => item.id === 'eur-purchase'),
		rate: { from: 'EUR', to: 'PLN', value: '4.25', provenance: 'recorded' }
	})
	expect(spending(converted.transactions, converted).base).toBe('5484')
})

test('capture review saves once; notification dismissal cannot lose a pending draft', () => {
	const pending = simulate(demo, 'ordinary')
	expect(pending.pending).toHaveLength(1)
	expect(balance(pending, 'mbank')).toBe(balance(demo, 'mbank'))
	expect(simulate(pending, 'ordinary').pending).toHaveLength(1)
	const draft = pending.pending[0]
	const transaction = {
		...demo.transactions[0],
		id: 'captured',
		eventId: draft.eventId,
		amount: draft.amount
	}
	const saved = saveTransaction(pending, transaction)
	expect(saved.pending).toHaveLength(0)
	expect(simulate(saved, 'ordinary').pending).toHaveLength(0)
	expect(() => saveTransaction(saved, { ...transaction, id: 'duplicate' })).toThrow('already')
	expect(simulate(demo, 'incomplete').pending[0].accountId).toBeNull()
	expect(dismissCapture(pending, draft.eventId).pending).toHaveLength(0)
})

test('location is optional, explicit and valid only for an Expense', () => {
	const expense = {
		...demo.transactions[0],
		location: { latitude: 52.23, longitude: 21.01, simulated: true }
	}
	expect(
		saveTransaction(demo, expense).transactions.find(item => item.id === expense.id)?.location
			.simulated
	).toBe(true)
	expect(() =>
		saveTransaction(demo, { ...expense, location: { ...expense.location, latitude: 91 } })
	).toThrow('location')
	expect(() => saveTransaction(demo, { ...expense, type: 'Income' })).toThrow('location')
	expect(validateBook(JSON.parse(JSON.stringify(saveTransaction(demo, expense))))).toEqual(
		saveTransaction(demo, expense)
	)
})

test('an explicit recorded rate pair edit preserves its decimal value', () => {
	const transaction = {
		...demo.transactions[0],
		rate: { from: 'EUR', to: 'PLN', value: '4.25', provenance: 'manual' }
	}
	const first = saveTransaction(demo, transaction)
	const edited = saveTransaction(first, {
		...transaction,
		rate: { ...transaction.rate, from: 'USD' }
	})
	expect(edited.transactions.find(item => item.id === transaction.id)?.rate).toEqual({
		from: 'USD',
		to: 'PLN',
		value: '4.25',
		provenance: 'manual'
	})
})

test('an explicitly unknown Opening balance survives export and remains net movement', () => {
	const account = demo.accounts[0]
	const next = saveAccount(demo, { ...account, opening: null }, true)
	expect(next.accounts.find(item => item.id === account.id)?.opening).toBeNull()
	expect(balance(next, account.id)).toBe('8766')
	expect(
		validateBook(JSON.parse(JSON.stringify(next))).accounts.find(item => item.id === account.id)
			?.opening
	).toBeNull()
})

test('Occurrence time orders a day and must fall on the Transaction date', () => {
	const base = { ...demo.transactions[0], date: '2026-10-05' }
	const book = [
		{ ...base, id: 'untimed' },
		{ ...base, id: 'morning', occurredAt: '2026-10-05T08:15:00+02:00' },
		{ ...base, id: 'evening', occurredAt: '2026-10-05T21:40:00+02:00' }
	].reduce(saveTransaction, demo)
	expect(filterTransactions(book, { from: '2026-10-05' }).map(item => item.id)).toEqual([
		'evening',
		'morning',
		'untimed'
	])
	expect(() => saveTransaction(demo, { ...base, occurredAt: '2026-10-06T08:15:00+02:00' })).toThrow(
		'Occurrence time'
	)
	expect(localInstant('2026-10-05', '08:15')).toMatch(localInstantPattern)
	expect(() => localInstant('2026-10-05', '8:15')).toThrow('HH:MM')
})

test('Counterparty history gives the usual range, last record and usual Category', () => {
	const shop = { ...demo.transactions[0], counterpartyId: 'shop' }
	const book = [
		{ ...shop, id: 'a', amount: '4000', date: '2026-10-02', categoryId: 'food' },
		{ ...shop, id: 'b', amount: '5210', date: '2026-10-03', categoryId: 'groceries' },
		{ ...shop, id: 'c', amount: '7000', date: '2026-10-04', categoryId: 'groceries' },
		{ ...shop, id: 'd', amount: '90000', date: '2026-10-05', categoryId: 'food' },
		{ ...shop, id: 'eur', accountId: 'revolut', amount: '100', date: '2026-10-06' },
		{ ...shop, id: 'income', type: 'Income' as const, amount: '100', date: '2026-10-06' }
	].reduce(saveTransaction, { ...demo, transactions: [] })
	const history = counterpartyHistory(book, {
		counterpartyId: 'shop',
		accountId: 'mbank',
		type: 'Expense'
	})
	expect(history?.count).toBe(4)
	expect([history?.low, history?.high]).toEqual(['4000', '90000'])
	expect(history?.last.id).toBe('d')
	expect(history?.categoryId).toBe('food')
	expect(
		counterpartyHistory(book, {
			counterpartyId: 'shop',
			accountId: 'mbank',
			type: 'Expense',
			excludeId: 'd'
		})?.categoryId
	).toBe('groceries')
	expect(
		counterpartyHistory(book, { counterpartyId: 'employer', accountId: 'mbank', type: 'Expense' })
	).toBeNull()
})
