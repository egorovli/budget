import { BudgetlyAI } from '../../modules/budgetly-ai/index.ts'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects needle.web.ts on web
import { runNeedle } from '../ai/needle'
import { isDate } from '../book/model.ts'
import type { Currency } from '../book/money.ts'
import { isCurrency, parseAmount } from '../book/money.ts'
import type { CommandDraft, CommandKind, InterpreterContext, ToolCall } from './draft.ts'
import { emptyDraft } from './draft.ts'
import { interpretWithRules } from './rules.ts'
import { systemPrompt, toolDefinitions } from './tools.ts'

// The interpreter runs the rules first. A model, when one is available, adds what the rules
// could not read. Rules win for amounts, currencies and dates, because they come straight from
// the text. Every field that a model added is marked uncertain for the confirmation form.

/** Null on web: the browser has no on-device Apple model or speech. */
export const native = BudgetlyAI as typeof BudgetlyAI | null

export type ModelName = 'apple' | 'needle'

const kinds: Record<string, CommandKind> = {
	add_expense: 'expense',
	add_income: 'income',
	transfer: 'transfer',
	set_balance: 'balance',
	add_account: 'account',
	add_reserve: 'reserve'
}

function text(value: unknown): string | null {
	return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function byName(items: InterpreterContext['accounts'], value: unknown): string | null {
	const name = text(value)?.toLowerCase()
	return items.find(item => item.name.toLowerCase() === name)?.id ?? null
}

type ArgumentName =
	| 'amount'
	| 'currency'
	| 'account'
	| 'from_account'
	| 'to_account'
	| 'reserve'
	| 'date'
	| 'merchant'
	| 'category'
	| 'source'
	| 'name'

/** Converts one model tool call into a draft. Unknown names and invalid values become null. */
export function draftFromToolCall(call: ToolCall, context: InterpreterContext): CommandDraft {
	const args = call.arguments as Partial<Record<ArgumentName, unknown>>
	const draft = emptyDraft()
	draft.kind = kinds[call.name] ?? 'unknown'
	const amount = typeof args.amount === 'number' ? Math.abs(args.amount) : null
	draft.amount = amount === null ? null : parseAmount(amount.toFixed(2))
	draft.currency = isCurrency(args.currency) ? (args.currency as Currency) : null
	draft.accountId = byName(context.accounts, args.account ?? args.from_account)
	draft.toAccountId = byName(context.accounts, args.to_account)
	draft.reserveId = byName(context.reserves, args.reserve)
	draft.date = isDate(args.date) ? (args.date as string) : null
	draft.note =
		[text(args.merchant), text(args.category), text(args.source), text(args.name)]
			.filter(Boolean)
			.join(' · ') || null
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
	source: ModelName
) {
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
	const fill = (field: Field, value: string | null) => {
		if (result[field] === null && value !== null) {
			;(result as Record<Field, string | null>)[field] = value
			result.uncertain.push(field)
		}
	}
	fill('accountId', model.accountId)
	fill('toAccountId', model.toAccountId)
	fill('reserveId', model.reserveId)
	fill('note', model.note)
	if (model.amount && grounded(model.amount, sentence)) {
		fill('amount', model.amount)
	}
	return result
}

function parseCalls(raw: string): { calls: ToolCall[]; confidence: number | null } {
	const value: unknown = JSON.parse(raw)
	if (Array.isArray(value)) {
		return { calls: value as ToolCall[], confidence: null }
	}
	const response = value as { function_calls?: ToolCall[]; confidence?: number }
	return { calls: response.function_calls ?? [], confidence: response.confidence ?? null }
}

export interface Interpretation {
	draft: CommandDraft
	/** Raw model output, for the AI settings test field. */
	raw: string | null
	model: ModelName | null
	error: string | null
	milliseconds: number
}

async function runModel(
	sentence: string,
	context: InterpreterContext
): Promise<{ raw: string | null; model: ModelName | null }> {
	const tools = JSON.stringify(toolDefinitions(context))
	const system = systemPrompt(context)
	if (native) {
		const status = await native.getAppleModelStatus()
		if (status.available) {
			return { raw: await native.interpretWithAppleModel(system, tools, sentence), model: 'apple' }
		}
	}
	const raw = await runNeedle(system, tools, sentence)
	return { raw, model: raw === null ? null : 'needle' }
}

export async function interpret(
	sentence: string,
	context: InterpreterContext
): Promise<Interpretation> {
	const started = Date.now()
	const rules = interpretWithRules(sentence, context)
	try {
		const { raw, model } = await runModel(sentence, context)
		const call = raw === null ? undefined : parseCalls(raw).calls[0]
		const modelDraft = call ? draftFromToolCall(call, context) : null
		return {
			draft: model ? merge(rules, modelDraft, sentence, model) : rules,
			raw,
			model,
			error: null,
			milliseconds: Date.now() - started
		}
	} catch (error) {
		return {
			draft: rules,
			raw: null,
			model: null,
			error: error instanceof Error ? error.message : 'The model failed.',
			milliseconds: Date.now() - started
		}
	}
}
