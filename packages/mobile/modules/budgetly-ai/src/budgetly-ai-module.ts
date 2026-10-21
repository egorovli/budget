import { NativeModule, requireNativeModule } from 'expo'
import type { AppleModelStatus, BudgetlyAIEvents, SpeechStatus } from './budgetly-ai.types.ts'

declare class BudgetlyAINativeModule extends NativeModule<BudgetlyAIEvents> {
	/** Status of on-device speech recognition for each locale. Never uses a server. */
	getSpeechStatus(locales: string[]): Promise<SpeechStatus[]>
	/** Downloads the system speech asset for a locale. Progress comes as `onSpeechDownload`. */
	downloadSpeech(locale: string): Promise<SpeechStatus>
	/** Requests microphone access and starts on-device recognition. Text comes as `onTranscript`. */
	startListening(locale: string, contextualStrings: string[]): Promise<void>
	/** Stops recognition and returns the finalized text. */
	stopListening(): Promise<string>
	cancelListening(): Promise<void>
	getAppleModelStatus(): Promise<AppleModelStatus>
	/**
	 * Runs the on-device Apple Foundation Model with guided generation. `toolsJson` is the same
	 * tool list that Needle gets. Returns a JSON array of `{ name, arguments }`.
	 */
	interpretWithAppleModel(instructions: string, toolsJson: string, text: string): Promise<string>
	/** Loads a Needle `.cact` file from a local path. Telemetry is turned off before the load. */
	needleLoad(path: string): Promise<void>
	/** Runs Needle and returns its raw JSON response. */
	needleComplete(system: string, toolsJson: string, text: string): Promise<string>
	needleUnload(): Promise<void>
	/** Excludes a file or directory from iCloud and device backups. */
	excludeFromBackup(path: string): Promise<void>
}

export const BudgetlyAI = requireNativeModule<BudgetlyAINativeModule>('BudgetlyAI')
