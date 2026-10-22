import type { ModelName } from './merge.ts'

// A debug log of commands: what the user said or typed, what each interpreter read, and what
// the app did. It stays on this device, outside the Book, its backups and exports, and keeps
// only the newest entries.

export const logLimit = 50

export interface LogEntry {
	id: string
	/** ISO time. */
	at: string
	input: 'typed' | 'voice'
	/** Speech locale, for voice. */
	locale: string | null
	/** Typed text, or the final transcript. Empty when speech recognized nothing. */
	text: string
	/** The live transcript at the last update before the final one, for voice. */
	heard: string | null
	/** What the rules read, as one line. */
	rules: string | null
	model: ModelName | null
	/** Raw model output. */
	raw: string | null
	/** What the app used after the merge, as one line. */
	result: string | null
	/** What the app did: the form it opened, the answer, or the problem. */
	outcome: string
	error: string | null
	milliseconds: number | null
}

/** The newest entry first, at most `logLimit` entries. */
export function appended(entries: readonly LogEntry[], entry: LogEntry): LogEntry[] {
	return [entry, ...entries].slice(0, logLimit)
}
