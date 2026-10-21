import { currencies } from '../book/money.ts'
import type { InterpreterContext } from './draft.ts'

// Tool definitions for model interpreters (Needle and Apple Foundation Models), in the
// OpenAI function shape. Enums hold the real Account and Reserve names, so a model cannot
// invent one.

interface Property {
	type: 'string' | 'number'
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
				...(reserves ? { reserve: property('string', 'Reserve that pays for it', reserves) } : {})
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
			"Move money between two of the user's own accounts, including a currency exchange.",
			{
				amount: amount('Amount sent'),
				currency,
				from_account: property('string', 'Source account', accounts),
				to_account: property('string', 'Destination account', accounts)
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
			{ name: property('string', 'Account name'), currency },
			['name']
		),
		tool(
			'add_reserve',
			'Set money aside for an upcoming cost or goal.',
			{
				name: property('string', 'What the money is for'),
				amount: amount('Amount'),
				currency
			},
			['name', 'amount']
		)
	]
}

export function systemPrompt(context: InterpreterContext): string {
	return `Today is ${context.today}. The default currency is ${context.baseCurrency}.`
}
