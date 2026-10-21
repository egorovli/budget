import type { Currency } from '../book/money.ts'

export type CommandKind =
	| 'expense'
	| 'income'
	| 'transfer'
	| 'balance'
	| 'account'
	| 'reserve'
	| 'unknown'

/**
 * A command that an interpreter read from a sentence. It is never saved directly:
 * the user confirms it on a form first. Names refer to Accounts and Reserves of the Book.
 */
export interface CommandDraft {
	kind: CommandKind
	/** Minor units, positive. */
	amount: string | null
	currency: Currency | null
	/** Account ID: the source of an Expense or Transfer, the target of Income or a balance. */
	accountId: string | null
	/** Account ID of the Transfer destination. */
	toAccountId: string | null
	reserveId: string | null
	/** YYYY-MM-DD. */
	date: string | null
	/** Merchant, payer, purpose or a new name (Account or Reserve). */
	note: string | null
	/** Fields that the interpreter guessed and the user must check. */
	uncertain: (keyof Omit<CommandDraft, 'kind' | 'uncertain' | 'sources'>)[]
	/** Interpreters that contributed, for example `rules` and `needle`. */
	sources: string[]
}

export interface InterpreterContext {
	accounts: readonly { id: string; name: string; currency: Currency }[]
	reserves: readonly { id: string; name: string; currency: Currency }[]
	baseCurrency: Currency
	/** YYYY-MM-DD, the local calendar date. */
	today: string
}

export function emptyDraft(): CommandDraft {
	return {
		kind: 'unknown',
		amount: null,
		currency: null,
		accountId: null,
		toAccountId: null,
		reserveId: null,
		date: null,
		note: null,
		uncertain: [],
		sources: []
	}
}

/**
 * A tool call in the shape that Needle returns and that the Apple Foundation Models adapter
 * also returns. Names and arguments follow `toolDefinitions`.
 */
export interface ToolCall {
	name: string
	arguments: Record<string, unknown>
}
