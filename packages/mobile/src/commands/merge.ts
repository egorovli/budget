import { isDate } from '../book/model.ts'
import type { Currency } from '../book/money.ts'
import { isCurrency, parseAmount } from '../book/money.ts'
import type { CommandDraft, CommandKind, InterpreterContext, Question, ToolCall } from './draft.ts'
import { emptyDraft } from './draft.ts'
import { mentions } from './rules.ts'

// Model output to drafts. Rules win for amounts, currencies and dates, because they come
// straight from the text. A model fills only what the rules left empty, and every field it
// fills is marked uncertain for the confirmation form.

export type ModelName = 'apple' | 'needle'

const kinds: Record<string, CommandKind> = {
	add_expense: 'expense',
	add_income: 'income',
	transfer: 'transfer',
	set_balance: 'balance',
	add_account: 'account',
	add_reserve: 'reserve',
	edit_last_record: 'edit_last',
	delete_last_record: 'delete_last',
	ask: 'question',
	set_rate: 'rate',
	update_rates: 'update_rates'
}

const questions: Record<string, Question> = {
	free_amount: 'free',
	account_balance: 'balance',
	spending: 'spent',
	rate: 'rate'
}

function text(value: unknown): string | null {
	return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function byName(items: InterpreterContext['reserves'], value: unknown): string | null {
	const name = text(value)?.toLowerCase()
	return items.find(item => item.name.toLowerCase() === name)?.id ?? null
}

function minor(value: unknown): string | null {
	return typeof value === 'number' ? parseAmount(Math.abs(value).toFixed(2)) : null
}

type ArgumentName =
	| 'amount'
	| 'currency'
	| 'account'
	| 'from_account'
	| 'to_account'
	| 'received'
	| 'reserve'
	| 'date'
	| 'due_date'
	| 'merchant'
	| 'category'
	| 'source'
	| 'name'
	| 'note'
	| 'opening_balance'
	| 'in_available_money'
	| 'question'
	| 'rate'

/** Converts one model tool call into a draft. Unknown names and invalid values become null. */
export function draftFromToolCall(call: ToolCall, context: InterpreterContext): CommandDraft {
	const args = call.arguments as Partial<Record<ArgumentName, unknown>>
	const draft = emptyDraft()
	draft.kind = kinds[call.name] ?? 'unknown'
	draft.amount = minor(args.amount ?? args.opening_balance)
	draft.received = minor(args.received)
	draft.currency = isCurrency(args.currency) ? (args.currency as Currency) : null
	draft.accountId = byName(context.accounts, args.account ?? args.from_account)
	draft.toAccountId = byName(context.accounts, args.to_account)
	draft.reserveId = byName(context.reserves, args.reserve)
	const date = args.date ?? args.due_date
	draft.date = isDate(date) ? date : null
	draft.note =
		[text(args.merchant), text(args.category), text(args.source), text(args.name), text(args.note)]
			.filter(Boolean)
			.join(' · ') || null
	draft.available = typeof args.in_available_money === 'boolean' ? args.in_available_money : null
	draft.question = questions[text(args.question) ?? ''] ?? null
	draft.rate = typeof args.rate === 'number' && args.rate > 0 ? String(args.rate) : null
	return draft
}

/** The digits of a model amount must appear in the text, or the model invented them. */
function grounded(amount: string, sentence: string): boolean {
	const whole = (BigInt(amount) / 100n).toString()
	return sentence.replace(/\s/g, '').includes(whole)
}

type Field = CommandDraft['uncertain'][number]

export function merge(
	rules: CommandDraft,
	model: CommandDraft | null,
	sentence: string,
	source: ModelName,
	context: InterpreterContext
): CommandDraft {
	if (!model || model.kind === 'unknown') {
		return rules
	}
	const result: CommandDraft = {
		...rules,
		uncertain: [...rules.uncertain],
		sources: [...rules.sources, source]
	}
	if (rules.kind === 'unknown') {
		result.kind = model.kind
	}
	const fill = <K extends Field>(field: K, value: CommandDraft[K]) => {
		if (result[field] === null && value !== null) {
			result[field] = value
			result.uncertain.push(field)
		}
	}
	// A small model picks a Reserve or an Account that the sentence does not name; then an
	// expense comes out of the wrong money without a sign. Accept only a named one.
	const named = (items: InterpreterContext['reserves'], id: string | null) => {
		const item = items.find(entry => entry.id === id)
		return item && mentions(sentence, item.name) ? item.id : null
	}
	fill('accountId', named(context.accounts, model.accountId))
	fill('toAccountId', named(context.accounts, model.toAccountId))
	fill('reserveId', named(context.reserves, model.reserveId))
	fill('note', model.note)
	fill('available', model.available)
	fill('question', model.question)
	if (model.amount && grounded(model.amount, sentence)) {
		fill('amount', model.amount)
	}
	if (model.received && grounded(model.received, sentence)) {
		fill('received', model.received)
	}
	return result
}
