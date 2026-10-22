import { describe, expect, test } from 'bun:test'
import type { InterpreterContext } from '../src/commands/draft.ts'
import { forKind } from '../src/commands/draft.ts'
import { draftFromToolCall, merge } from '../src/commands/merge.ts'
import { interpretWithRules } from '../src/commands/rules.ts'
import { systemPrompt } from '../src/commands/tools.ts'

const context: InterpreterContext = {
	accounts: [
		{ id: 'rev-pln', name: 'Revolut PLN', currency: 'PLN', available: true },
		{ id: 'rev-eur', name: 'Revolut EUR', currency: 'EUR', available: true },
		{ id: 'savings', name: 'Savings', currency: 'PLN', available: false }
	],
	reserves: [{ id: 'zus', name: 'ZUS and tax', currency: 'PLN' }],
	baseCurrency: 'PLN',
	today: '2026-10-22'
}

function run(sentence: string, name: string, args: Record<string, unknown>) {
	const rules = interpretWithRules(sentence, context)
	const model = draftFromToolCall({ name, arguments: args }, context)
	return forKind(merge(rules, model, sentence, 'apple', context))
}

describe('merge', () => {
	test('drops a Reserve that the sentence does not name', () => {
		const draft = run('27.50 at Żabka from Revolut', 'add_expense', {
			amount: 27.5,
			account: 'Revolut PLN',
			reserve: 'ZUS and tax'
		})
		expect(draft).toMatchObject({ kind: 'expense', accountId: 'rev-pln', reserveId: null })
	})

	test('keeps a Reserve that the sentence names', () => {
		const draft = run('paid 1850 for ZUS from the ZUS reserve', 'add_expense', {
			amount: 1850,
			reserve: 'ZUS and tax'
		})
		expect(draft.reserveId).toBe('zus')
	})

	test('drops a destination on an expense', () => {
		const draft = run('paid 120 for internet', 'add_expense', {
			amount: 120,
			to_account: 'Revolut EUR'
		})
		expect(draft).toMatchObject({ kind: 'expense', toAccountId: null })
	})

	test('takes the opening balance and the Available money flag of a new Account', () => {
		const draft = run('create a savings wallet called Wise, keep it out', 'add_account', {
			name: 'Wise',
			currency: 'EUR',
			opening_balance: 300,
			in_available_money: false
		})
		expect(draft).toMatchObject({ kind: 'account', available: false, amount: null })
	})
})

test('the system prompt lists currencies and Accounts outside Available money', () => {
	const prompt = systemPrompt(context)
	expect(prompt).toContain('Revolut EUR (EUR)')
	expect(prompt).toContain('Savings (PLN, not in Available money)')
	expect(prompt).toContain('ZUS and tax (PLN)')
})
