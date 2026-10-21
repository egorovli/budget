import { describe, expect, test } from 'bun:test'
import type { CommandDraft, InterpreterContext } from '../src/commands/draft.ts'
import { interpretWithRules } from '../src/commands/rules.ts'

const context: InterpreterContext = {
	accounts: [
		{ id: 'revolut', name: 'Revolut', currency: 'PLN' },
		{ id: 'erste', name: 'Erste', currency: 'PLN' },
		{ id: 'cash', name: 'Cash', currency: 'PLN' },
		{ id: 'tbank', name: 'TBank', currency: 'RUB' }
	],
	reserves: [
		{ id: 'rent', name: 'Rent', currency: 'PLN' },
		{ id: 'vacation', name: 'Vacation', currency: 'PLN' }
	],
	baseCurrency: 'PLN',
	today: '2026-10-21'
}

type Expected = Partial<Omit<CommandDraft, 'sources'>>

const cases: [string, Expected][] = [
	[
		'add a payment of 27.50 zł at Żabka for groceries from my Revolut card',
		{
			kind: 'expense',
			amount: '2750',
			currency: 'PLN',
			accountId: 'revolut',
			toAccountId: null,
			note: 'Żabka · groceries',
			uncertain: []
		}
	],
	[
		'купил продукты в жабке на 27,50 злотых с революта',
		{
			kind: 'expense',
			amount: '2750',
			currency: 'PLN',
			accountId: 'revolut',
			note: 'жабке',
			uncertain: ['accountId']
		}
	],
	[
		'zapłaciłem 30 zł za kawę gotówką',
		{
			kind: 'expense',
			amount: '3000',
			currency: 'PLN',
			accountId: 'cash',
			note: 'kawę',
			uncertain: ['accountId']
		}
	],
	[
		'переведи 200 евро с Revolut на Erste',
		{
			kind: 'transfer',
			amount: '20000',
			currency: 'EUR',
			accountId: 'revolut',
			toAccountId: 'erste',
			note: null,
			uncertain: []
		}
	],
	[
		'transfer 200 EUR from Revolut to Erste',
		{
			kind: 'transfer',
			amount: '20000',
			currency: 'EUR',
			accountId: 'revolut',
			toAccountId: 'erste'
		}
	],
	[
		'przelej 150 zł z revoluta na erste',
		{
			kind: 'transfer',
			amount: '15000',
			currency: 'PLN',
			accountId: 'revolut',
			toAccountId: 'erste',
			uncertain: ['accountId']
		}
	],
	[
		'перекинь на эрсте с революта 500',
		{ kind: 'transfer', amount: '50000', accountId: 'revolut', toAccountId: 'erste' }
	],
	[
		'move 100 to Erste from Cash',
		{ kind: 'transfer', amount: '10000', accountId: 'cash', toAccountId: 'erste' }
	],
	[
		'salary 12000 to Erste',
		{ kind: 'income', amount: '1200000', currency: null, accountId: 'erste', date: null }
	],
	[
		'зарплата пришла на эрсте 8 500 злотых',
		{ kind: 'income', amount: '850000', currency: 'PLN', accountId: 'erste' }
	],
	['wypłata 7000 zł na Erste', { kind: 'income', amount: '700000', accountId: 'erste' }],
	['got paid $300 for the logo', { kind: 'income', amount: '30000', currency: 'USD' }],
	[
		'вчера потратил 45 на кофе',
		{
			kind: 'expense',
			amount: '4500',
			currency: null,
			accountId: null,
			date: '2026-10-20',
			note: 'кофе'
		}
	],
	[
		'put aside 3500 for rent',
		{ kind: 'reserve', amount: '350000', reserveId: 'rent', note: 'rent' }
	],
	['отложи 3500 на аренду', { kind: 'reserve', amount: '350000', reserveId: null, note: 'аренду' }],
	[
		'odłóż 500 zł na wakacje',
		{ kind: 'reserve', amount: '50000', currency: 'PLN', note: 'wakacje' }
	],
	[
		'баланс эрсте 12 400',
		{ kind: 'balance', amount: '1240000', accountId: 'erste', uncertain: [] }
	],
	['saldo Revolut 3 210,55 zł', { kind: 'balance', amount: '321055', accountId: 'revolut' }],
	['add account mBank', { kind: 'account', amount: null, accountId: null, note: 'mBank' }],
	['создай карту Альфа', { kind: 'account', note: 'Альфа' }],
	['dodaj nowe konto Pekao', { kind: 'account', note: 'Pekao' }],
	[
		'1 234,50 zł on 15.10',
		{ kind: 'expense', amount: '123450', currency: 'PLN', date: '2026-10-15' }
	],
	[
		'27 с половиной евро на такси',
		{ kind: 'expense', amount: '2750', currency: 'EUR', note: 'такси' }
	],
	[
		'позавчера купил кофе за 12 руб',
		{ kind: 'expense', amount: '1200', currency: 'RUB', date: '2026-10-19' }
	],
	['spent 40 on 15th', { kind: 'expense', amount: '4000', date: '2026-10-15' }],
	[
		'15 октября заплатил 99,90 с тбанка',
		{ date: '2026-10-15', amount: '9990', accountId: 'tbank' }
	],
	['wydałem 20 euro 3 listopada', { amount: '2000', currency: 'EUR', date: '2025-11-03' }],
	['paid 50 on 2026-09-30 w Biedronce', { amount: '5000', date: '2026-09-30', note: 'Biedronce' }],
	['dziś zapłaciłem 12.05 zł', { amount: '1205', currency: 'PLN', date: '2026-10-21' }],
	['bought shoes for 1500 драмов', { amount: '150000', currency: 'AMD' }],
	['spent 15 day before yesterday', { date: '2026-10-19' }],
	[
		'paid 1200 from the rent reserve',
		{ kind: 'expense', amount: '120000', reserveId: 'rent', accountId: null }
	],
	['what is the weather today', { kind: 'unknown', amount: null, date: '2026-10-21' }],
	['привет, как дела', { kind: 'unknown', amount: null, currency: null, note: null }],
	['co słychać', { kind: 'unknown', amount: null }]
]

describe('interpretWithRules', () => {
	for (const [sentence, expected] of cases) {
		test(sentence, () => {
			const draft = interpretWithRules(sentence, context)
			expect(draft.sources).toEqual(['rules'])
			expect(draft).toMatchObject(expected)
		})
	}

	test('never invents a currency', () => {
		expect(interpretWithRules('spent 10 at Lidl', context).currency).toBeNull()
	})

	test('ignores zero amounts', () => {
		expect(interpretWithRules('hello 0', context)).toMatchObject({ kind: 'unknown', amount: null })
	})
})
