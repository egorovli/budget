import { expect, test } from 'bun:test'
import type { Book, Expense, Transfer } from '../src/book/model.ts'
import {
	accountBalance,
	createBook,
	freeAmount,
	recordBalance,
	removeRecord,
	saveAccount,
	saveExpense,
	saveIncome,
	saveReserve,
	saveTransfer,
	setRates,
	validateBook
} from '../src/book/model.ts'

const created = '2026-10-01T08:00:00.000Z'

function setUp(): Book {
	let book = createBook('book')
	book = saveAccount(book, {
		id: 'bank',
		name: 'Bank',
		currency: 'PLN',
		available: true,
		createdAt: created
	})
	book = saveAccount(book, {
		id: 'euro',
		name: 'Euro',
		currency: 'EUR',
		available: true,
		createdAt: created
	})
	book = saveAccount(book, {
		id: 'savings',
		name: 'Savings',
		currency: 'PLN',
		available: false,
		createdAt: created
	})
	book = recordBalance(book, {
		id: 'b1',
		accountId: 'bank',
		amount: '1000000',
		date: '2026-10-01',
		recordedAt: '2026-10-01T09:00:00.000Z'
	})
	book = recordBalance(book, {
		id: 'b2',
		accountId: 'savings',
		amount: '5000000',
		date: '2026-10-01',
		recordedAt: '2026-10-01T09:00:00.000Z'
	})
	return book
}

function expense(id: string, amount: string, date: string, createdAt: string): Expense {
	return {
		id,
		kind: 'expense',
		accountId: 'bank',
		amount,
		date,
		note: '',
		createdAt,
		reserveUse: null
	}
}

test('a balance is the latest Reported balance minus the Expenses after it', () => {
	let book = setUp()
	book = saveExpense(book, expense('e1', '2500', '2026-10-02', '2026-10-02T10:00:00.000Z'))
	// Same date, recorded after the balance: it counts.
	book = saveExpense(book, expense('e2', '1000', '2026-10-01', '2026-10-01T12:00:00.000Z'))
	// Backdated: the bank balance already contains it.
	book = saveExpense(book, expense('e3', '700', '2026-09-30', '2026-10-02T11:00:00.000Z'))
	expect(accountBalance(book, 'bank')).toMatchObject({ amount: '996500', difference: null })
	expect(accountBalance(book, 'euro')).toMatchObject({ amount: null, latest: null })
	expect(accountBalance(removeRecord(book, 'e1'), 'bank').amount).toBe('999000')
})

test('a new Reported balance shows the Unrecorded difference and does not invent records', () => {
	let book = setUp()
	book = saveExpense(book, expense('e1', '2500', '2026-10-02', '2026-10-02T10:00:00.000Z'))
	book = recordBalance(book, {
		id: 'b3',
		accountId: 'bank',
		amount: '1200000',
		date: '2026-10-05',
		recordedAt: '2026-10-05T09:00:00.000Z'
	})
	const balance = accountBalance(book, 'bank')
	expect(balance.amount).toBe('1200000')
	// Expected 9 975.00; the bank shows 12 000.00, for example after a salary.
	expect(balance.difference).toBe('202500')
	expect(book.transactions).toHaveLength(1)
})

test('the Free amount is Available money minus open Reserves', () => {
	let book = setUp()
	book = saveReserve(book, {
		id: 'rent',
		name: 'Rent',
		amount: '350000',
		currency: 'PLN',
		dueDate: '2026-11-01',
		createdAt: created,
		closedAt: null
	})
	book = saveReserve(book, {
		id: 'old',
		name: 'Closed',
		amount: '100000',
		currency: 'PLN',
		dueDate: null,
		createdAt: created,
		closedAt: created
	})
	expect(freeAmount(book)).toEqual({
		available: '1000000',
		reserved: '350000',
		free: '650000',
		accountsWithoutBalance: ['euro'],
		currenciesWithoutRate: []
	})
})

test('a Reserve-funded expense reduces the Reserve and the balance only once', () => {
	let book = setUp()
	book = saveReserve(book, {
		id: 'rent',
		name: 'Rent',
		amount: '350000',
		currency: 'PLN',
		dueDate: null,
		createdAt: created,
		closedAt: null
	})
	const free = freeAmount(book).free
	book = saveExpense(book, {
		...expense('e1', '350000', '2026-10-02', '2026-10-02T10:00:00.000Z'),
		reserveUse: { reserveId: 'rent', amount: '350000' }
	})
	expect(freeAmount(book)).toMatchObject({ available: '650000', reserved: '0', free })
	// Overspending a Reserve does not make it negative.
	book = saveExpense(book, {
		...expense('e2', '10000', '2026-10-02', '2026-10-02T11:00:00.000Z'),
		reserveUse: { reserveId: 'rent', amount: '10000' }
	})
	expect(freeAmount(book)).toMatchObject({ reserved: '0', free: '640000' })
})

test('foreign amounts use the current rate; a missing rate is reported, never zero', () => {
	let book = setUp()
	book = recordBalance(book, {
		id: 'b3',
		accountId: 'euro',
		amount: '10000',
		date: '2026-10-01',
		recordedAt: '2026-10-01T09:00:00.000Z'
	})
	expect(freeAmount(book)).toMatchObject({ available: '1000000', currenciesWithoutRate: ['EUR'] })
	book = setRates(book, [{ currency: 'EUR', value: '4.2715', date: '2026-10-01', source: 'NBP A' }])
	expect(freeAmount(book)).toMatchObject({ available: '1042715', currenciesWithoutRate: [] })
})

test('commands reject invalid records and keep the revision sequence', () => {
	const book = setUp()
	expect(book.revision).toBe(5)
	expect(() =>
		saveExpense(book, { ...expense('e1', '0', '2026-10-02', created), amount: '0' })
	).toThrow()
	expect(() =>
		saveExpense(book, {
			...expense('e1', '100', '2026-10-02', created),
			reserveUse: { reserveId: 'none', amount: '100' }
		})
	).toThrow('open Reserve')
	expect(() =>
		saveAccount(book, {
			id: 'bank',
			name: 'Bank',
			currency: 'EUR',
			available: true,
			createdAt: created
		})
	).toThrow('currency')
})

test('a snapshot survives a JSON round trip; invalid snapshots are rejected', () => {
	const book = setUp()
	expect(validateBook(JSON.parse(JSON.stringify(book)))).toEqual(book)
	expect(() => validateBook({ ...book, schema: 2 })).toThrow('version')
	expect(() =>
		validateBook({ ...book, balances: [{ ...book.balances[0], accountId: 'missing' }] })
	).toThrow('Reported balances')
})

test('Income adds to the balance; a Transfer moves money between Accounts in their currencies', () => {
	let book = setUp()
	book = recordBalance(book, {
		id: 'b3',
		accountId: 'euro',
		amount: '10000',
		date: '2026-10-01',
		recordedAt: '2026-10-01T09:00:00.000Z'
	})
	book = saveIncome(book, {
		id: 'i1',
		kind: 'income',
		accountId: 'bank',
		amount: '500000',
		date: '2026-10-02',
		note: 'Salary',
		createdAt: '2026-10-02T10:00:00.000Z'
	})
	book = saveTransfer(book, {
		id: 't1',
		fromAccountId: 'bank',
		toAccountId: 'euro',
		sent: '43641',
		received: '10000',
		date: '2026-10-03',
		note: '',
		createdAt: '2026-10-03T10:00:00.000Z'
	})
	expect(accountBalance(book, 'bank').amount).toBe('1456359')
	expect(accountBalance(book, 'euro').amount).toBe('20000')
	expect(() =>
		saveTransfer(book, { ...book.transfers[0], id: 't2', toAccountId: 'bank' } as Transfer)
	).toThrow('two different')
	const removed = removeRecord(book, 't1')
	expect(accountBalance(removed, 'euro').amount).toBe('10000')
	expect(validateBook(JSON.parse(JSON.stringify(book)))).toEqual(book)
	// A Book saved before Transfers existed still opens.
	const { transfers: _, ...old } = removed
	expect(validateBook(old).transfers).toEqual([])
})
