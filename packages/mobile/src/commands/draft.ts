import type { Currency } from '../book/money.ts'

export type CommandKind =
	| 'expense'
	| 'income'
	| 'transfer'
	| 'balance'
	| 'account'
	| 'reserve'
	/** Opens the last saved record with the changed fields. */
	| 'edit_last'
	/** Opens the last saved record, ready to delete. */
	| 'delete_last'
	/** Answers from the Book; saves nothing. */
	| 'question'
	/** Sets one exchange rate by hand. */
	| 'rate'
	/** Downloads current rates from NBP. */
	| 'update_rates'
	| 'unknown'

export type Question = 'free' | 'balance' | 'spent' | 'rate'

/** Kinds that the rules read reliably and that a model does not improve. */
export const ruleOnlyKinds: ReadonlySet<CommandKind> = new Set([
	'edit_last',
	'delete_last',
	'question',
	'rate',
	'update_rates'
])

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
	/** Transfer between currencies: the amount that arrived, in minor units. */
	received: string | null
	/** New Account: false when it is not in Available money. */
	available: boolean | null
	/** Rate command: base currency units for one unit of `currency`, as a decimal. */
	rate: string | null
	question: Question | null
	/** Spending question: first and last day, YYYY-MM-DD. */
	period: { from: string; to: string } | null
	/** Fields that the interpreter guessed and the user must check. */
	uncertain: (keyof Omit<CommandDraft, 'kind' | 'uncertain' | 'sources'>)[]
	/** Interpreters that contributed, for example `rules` and `needle`. */
	sources: string[]
}

export interface InterpreterContext {
	accounts: readonly { id: string; name: string; currency: Currency; available: boolean }[]
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
		received: null,
		available: null,
		rate: null,
		question: null,
		period: null,
		uncertain: [],
		sources: []
	}
}

/** Drops the fields that the kind does not use, so a form never gets a stray value. */
export function forKind(draft: CommandDraft): CommandDraft {
	const used: Record<CommandKind, readonly Field[]> = {
		expense: ['amount', 'currency', 'accountId', 'reserveId', 'date', 'note'],
		income: ['amount', 'currency', 'accountId', 'date', 'note'],
		transfer: ['amount', 'currency', 'accountId', 'toAccountId', 'date', 'note', 'received'],
		balance: ['amount', 'currency', 'accountId', 'date'],
		account: ['amount', 'currency', 'note', 'available'],
		reserve: ['amount', 'currency', 'date', 'note', 'reserveId'],
		edit_last: ['amount', 'date', 'note'],
		delete_last: [],
		question: ['currency', 'accountId', 'note', 'question', 'period'],
		rate: ['currency', 'rate'],
		update_rates: [],
		unknown: ['amount', 'currency', 'accountId', 'date', 'note']
	}
	const keep = new Set(used[draft.kind])
	const result = { ...emptyDraft(), kind: draft.kind, sources: draft.sources }
	for (const field of keep) {
		;(result as Record<Field, unknown>)[field] = draft[field]
	}
	result.uncertain = draft.uncertain.filter(field => keep.has(field))
	return result
}

type Field = CommandDraft['uncertain'][number]

/**
 * A tool call in the shape that Needle returns and that the Apple Foundation Models adapter
 * also returns. Names and arguments follow `toolDefinitions`.
 */
export interface ToolCall {
	name: string
	arguments: Record<string, unknown>
}
