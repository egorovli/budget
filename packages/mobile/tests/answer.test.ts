import { describe, expect, test } from 'bun:test'
import type { Book } from '../src/book/model.ts'
import {
	createBook,
	recordBalance,
	saveAccount,
	saveExpense,
	saveReserve,
	setRates
} from '../src/book/model.ts'
import { answer } from '../src/commands/answer.ts'
import { interpreterContext } from '../src/commands/open-draft.ts'
import { interpretWithRules } from '../src/commands/rules.ts'

const created = '2026-10-01T08:00:00.000Z'
const today = '2026-10-22'

function setUp(): Book {
	let book = createBook('book')
	for (const [id, name, currency] of [
		['rev', 'Revolut PLN', 'PLN'],
		['eur', 'Revolut EUR', 'EUR']
	] as const) {
		book = saveAccount(book, { id, name, currency, available: true, createdAt: created })
	}
	book = recordBalance(book, {
		id: 'b1',
		accountId: 'rev',
		amount: '100000',
		date: '2026-10-01',
		recordedAt: created
	})
	book = recordBalance(book, {
		id: 'b2',
		accountId: 'eur',
		amount: '10000',
		date: '2026-10-01',
		recordedAt: created
	})
	book = setRates(book, [{ currency: 'EUR', value: '4.25', date: '2026-10-21', source: 'NBP' }])
	book = saveReserve(book, {
		id: 'rent',
		name: 'Rent',
		amount: '30000',
		currency: 'PLN',
		dueDate: null,
		createdAt: created,
		closedAt: null
	})
	const expenses = [
		['e1', 'rev', '2750', '2026-10-20', 'Żabka'],
		['e2', 'rev', '1000', '2026-10-21', 'Żabka · groceries'],
		['e3', 'eur', '1000', '2026-10-21', 'Hotel'],
		['e4', 'rev', '5000', '2026-09-30', 'Żabka']
	] as const
	for (const [id, accountId, amount, date, note] of expenses) {
		book = saveExpense(book, {
			id,
			kind: 'expense',
			accountId,
			amount,
			date,
			note,
			createdAt: created,
			reserveUse: null
		})
	}
	return book
}

function ask(book: Book, sentence: string): string {
	// formatAmount groups digits with a thin space; plain spaces keep the cases readable.
	return answer(book, interpretWithRules(sentence, interpreterContext(book, today))).replaceAll(
		'\u2009',
		' '
	)
}

describe('answer', () => {
	const book = setUp()

	test('free amount with its basis', () => {
		expect(ask(book, 'сколько у меня свободно?')).toBe(
			'Free amount: 1 045.00 PLN. Available money 1 345.00 PLN, Reserves 300.00 PLN.'
		)
	})

	test('spending at a merchant in Russian, this month', () => {
		expect(ask(book, 'сколько я потратил в жабке?')).toBe(
			'Spent 37.50 PLN at жабке in October 2026 (2 expenses).'
		)
	})

	test('spending in all currencies, converted to the base currency', () => {
		expect(ask(book, 'how much did I spend yesterday?')).toBe(
			'Spent 52.50 PLN on 2026-10-21 (2 expenses).'
		)
	})

	test('spending last month', () => {
		expect(ask(book, 'ile wydałem w zeszłym miesiącu?')).toBe(
			'Spent 50.00 PLN in September 2026 (1 expense).'
		)
	})

	test('balance of one Account', () => {
		expect(ask(book, 'how much is on Revolut EUR?')).toBe(
			'Revolut EUR: 90.00 EUR, bank balance of 2026-10-01.'
		)
	})

	test('rate', () => {
		expect(ask(book, 'какой курс евро?')).toBe('1 EUR = 4.25 PLN (NBP, 2026-10-21)')
	})
})
