import { BudgetAI } from '../../modules/budget-ai/index.ts'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects needle.web.ts on web
import { runNeedle } from '../ai/needle'
import type { CommandDraft, InterpreterContext, ToolCall } from './draft.ts'
import { forKind, ruleOnlyKinds } from './draft.ts'
import type { ModelName } from './merge.ts'
import { draftFromToolCall, merge } from './merge.ts'
import { interpretWithRules } from './rules.ts'
import { systemPrompt, toolDefinitions } from './tools.ts'

// The interpreter runs the rules first. A model, when one is available, adds what the rules
// could not read; see merge.ts.

/** Null on web: the browser has no on-device Apple model or speech. */
export const native = BudgetAI as typeof BudgetAI | null

export type { ModelName } from './merge.ts'

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
	/** What the rules read alone, before the merge. */
	rules: CommandDraft
	/** Raw model output, for the AI settings test field. */
	raw: string | null
	model: ModelName | null
	error: string | null
	milliseconds: number
}

async function runModel(
	sentence: string,
	context: InterpreterContext,
	only: ModelName | null
): Promise<{ raw: string | null; model: ModelName | null }> {
	const tools = JSON.stringify(toolDefinitions(context))
	const system = systemPrompt(context)
	let appleError: unknown = null
	if (native && only !== 'needle') {
		const status = await native.getAppleModelStatus()
		if (status.available) {
			try {
				return {
					raw: await native.interpretWithAppleModel(system, tools, sentence),
					model: 'apple'
				}
			} catch (error) {
				// A guardrail or a busy session: Needle reads the sentence instead.
				if (only === 'apple') {
					throw error
				}
				appleError = error
			}
		}
	}
	if (only === 'apple') {
		return { raw: null, model: null }
	}
	const raw = await runNeedle(system, tools, sentence)
	if (raw === null && appleError) {
		throw appleError
	}
	return { raw, model: raw === null ? null : 'needle' }
}

/** `only` limits the run to one model, to compare models on the AI page. */
export async function interpret(
	sentence: string,
	context: InterpreterContext,
	only: ModelName | null = null
): Promise<Interpretation> {
	const started = Date.now()
	const rules = interpretWithRules(sentence, context)
	// Questions and edits are plain phrases: answer at once, without the model's seconds.
	if (ruleOnlyKinds.has(rules.kind) && only === null) {
		return {
			draft: rules,
			rules,
			raw: null,
			model: null,
			error: null,
			milliseconds: Date.now() - started
		}
	}
	try {
		const { raw, model } = await runModel(sentence, context, only)
		const call = raw === null ? undefined : parseCalls(raw).calls[0]
		const modelDraft = call ? draftFromToolCall(call, context) : null
		return {
			draft: forKind(model ? merge(rules, modelDraft, sentence, model, context) : rules),
			rules,
			raw,
			model,
			error: null,
			milliseconds: Date.now() - started
		}
	} catch (error) {
		return {
			draft: rules,
			rules,
			raw: null,
			model: null,
			error: error instanceof Error ? error.message : 'The model failed.',
			milliseconds: Date.now() - started
		}
	}
}
