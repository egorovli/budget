export type SpeechState = 'ready' | 'needs-download' | 'unsupported' | 'unavailable'

export interface SpeechStatus {
	/** BCP 47, for example `en-US` or `ru-RU`. */
	locale: string
	state: SpeechState
	/** The Apple module that serves this locale on the device. */
	engine: 'speech-transcriber' | 'dictation-transcriber' | 'sf-speech-recognizer' | null
}

export interface TranscriptEvent {
	/** Increases with each event of one listening session. Drop events with a lower revision. */
	revision: number
	/** The full text so far: finalized text plus the volatile tail. */
	text: string
	/** The finalized part of `text`. */
	finalText: string
}

export interface SpeechDownloadEvent {
	locale: string
	fraction: number
}

export interface AppleModelStatus {
	available: boolean
	/** `deviceNotEligible`, `appleIntelligenceNotEnabled`, `modelNotReady`, `unsupportedOS`, `unsupportedLanguage`. */
	reason: string | null
}

// biome-ignore lint/style/useConsistentTypeDefinitions: Expo EventsMap needs a type alias
export type BudgetAIEvents = {
	onTranscript: (event: TranscriptEvent) => void
	onSpeechDownload: (event: SpeechDownloadEvent) => void
	onAudioLevel: (event: { level: number }) => void
}
