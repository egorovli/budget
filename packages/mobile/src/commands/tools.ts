import { currencies } from '../book/money.ts'
import type { InterpreterContext } from './draft.ts'

// Tool definitions for model interpreters (Needle and Apple Foundation Models), in the
// OpenAI function shape. Enums hold the real Account and Reserve names, so a model cannot
// invent one.

interface Property {
	type: 'string' | 'number' | 'boolean'
	description: string
	enum?: string[]
}

export interface ToolDefinition {
	type: 'function'
	function: {
		name: ToolName
		description: string
		parameters: { type: 'object'; properties: Record<string, Property>; required: string[] }
	}
}

export type ToolName =
	| 'add_expense'
	| 'add_income'
	| 'transfer'
	| 'set_balance'
	| 'add_account'
	| 'add_reserve'
	| 'edit_last_record'
	| 'delete_last_record'
	| 'ask'
	| 'set_rate'
	| 'update_rates'

function names(items: readonly { name: string }[]): string[] | undefined {
	return items.length > 0 ? items.map(item => item.name) : undefined
}

function property(type: Property['type'], description: string, values?: string[]): Property {
	return values ? { type, description, enum: values } : { type, description }
}

function tool(
	name: ToolName,
	description: string,
	properties: Record<string, Property>,
	required: string[]
): ToolDefinition {
	return {
		type: 'function',
		function: { name, description, parameters: { type: 'object', properties, required } }
	}
}

export function toolDefinitions(context: InterpreterContext): ToolDefinition[] {
	const accounts = names(context.accounts)
	const reserves = names(context.reserves)
	const currency = property('string', 'Currency code', [...currencies])
	const amount = (description: string) => property('number', description)
	const date = property('string', 'Date as YYYY-MM-DD')
	return [
		tool(
			'add_expense',
			'Record money the user spent or paid.',
			{
				amount: amount('Amount spent'),
				currency,
				account: property('string', 'Account the money left', accounts),
				merchant: property('string', 'Shop, person or service paid'),
				category: property('string', 'What it was for, for example groceries'),
				...(reserves
					? { reserve: property('string', 'Reserve that pays for it, only if named', reserves) }
					: {})
			},
			['amount']
		),
		tool(
			'add_income',
			'Record money the user received, such as salary or a refund.',
			{
				amount: amount('Amount received'),
				currency,
				account: property('string', 'Account the money arrived to', accounts),
				source: property('string', 'Who paid')
			},
			['amount']
		),
		tool(
			'transfer',
			"Move money between two of the user's own accounts: a top-up, a cash withdrawal or a currency exchange.",
			{
				amount: amount('Amount sent'),
				currency,
				from_account: property('string', 'Source account', accounts),
				to_account: property('string', 'Destination account', accounts),
				received: amount('Amount that arrived, for a currency exchange')
			},
			['amount', 'from_account', 'to_account']
		),
		tool(
			'set_balance',
			'Set the current bank balance of an account.',
			{ account: property('string', 'Account', accounts), amount: amount('Balance') },
			['account', 'amount']
		),
		tool(
			'add_account',
			'Create a new account, card or wallet.',
			{
				name: property('string', 'Account name'),
				currency,
				opening_balance: amount('Current balance of the new account'),
				in_available_money: property(
					'boolean',
					'False when the user says not to count this account, for example savings'
				)
			},
			['name']
		),
		tool(
			'add_reserve',
			'Set money aside for an upcoming cost or goal.',
			{
				name: property('string', 'What the money is for'),
				amount: amount('Amount'),
				currency,
				due_date: date
			},
			['name', 'amount']
		),
		tool(
			'edit_last_record',
			'Change the last saved expense, income or transfer.',
			{ amount: amount('New amount'), date, note: property('string', 'New note') },
			[]
		),
		tool('delete_last_record', 'Delete or undo the last saved record.', {}, []),
		tool(
			'ask',
			'Answer a question about the money. Nothing is saved.',
			{
				question: property('string', 'What the user asks about', [
					'free_amount',
					'account_balance',
					'spending',
					'rate'
				]),
				account: property('string', 'Account the question is about', accounts),
				merchant: property('string', 'Shop or service, for a spending question'),
				currency
			},
			['question']
		),
		tool(
			'set_rate',
			`Set the exchange rate of a currency in ${context.baseCurrency}.`,
			{ currency, rate: amount(`${context.baseCurrency} for one unit of the currency`) },
			['currency', 'rate']
		),
		tool('update_rates', 'Download current exchange rates.', {}, [])
	]
}

/** The facts a model needs: names with currencies, and what counts in Available money. */
export function systemPrompt(context: InterpreterContext): string {
	const accounts = context.accounts.map(
		account =>
			`${account.name} (${account.currency}${account.available ? '' : ', not in Available money'})`
	)
	const reserves = context.reserves.map(reserve => `${reserve.name} (${reserve.currency})`)
	return [
		`Today is ${context.today}. The default currency is ${context.baseCurrency}.`,
		`Accounts: ${accounts.join('; ') || 'none yet'}.`,
		`Reserves: ${reserves.join('; ') || 'none'}.`,
		'Fill an account or reserve only when the user names it. Never guess one.'
	].join('\n')
}
