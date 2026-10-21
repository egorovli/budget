import { BudgetlyAI } from '../../modules/budgetly-ai/index.ts'
import { needle } from './catalog.ts'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects model-store.web.ts on web
import { filePath, isDownloaded } from './model-store'

let loaded: Promise<void> | null = null

/** Runs Needle on the device. Returns its raw JSON response, or null when it is not downloaded. */
export async function runNeedle(system: string, toolsJson: string, text: string) {
	if (!(await isDownloaded(needle))) {
		return null
	}
	loaded ??= BudgetlyAI.needleLoad(filePath(needle, 'needle3.cact')).catch((error: unknown) => {
		loaded = null
		throw error
	})
	await loaded
	return BudgetlyAI.needleComplete(system, toolsJson, text)
}

export function forgetNeedle(): void {
	loaded = null
}
