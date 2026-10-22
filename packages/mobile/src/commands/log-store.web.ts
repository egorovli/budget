import type { LogEntry } from './log.ts'
import { appended } from './log.ts'

// Browser development storage for the command log.

const key = 'budgetly.command-log'

export function loadLog(): Promise<LogEntry[]> {
	try {
		return Promise.resolve(JSON.parse(localStorage.getItem(key) ?? '[]') as LogEntry[])
	} catch {
		return Promise.resolve([])
	}
}

export async function saveLogEntry(entry: LogEntry): Promise<void> {
	localStorage.setItem(key, JSON.stringify(appended(await loadLog(), entry)))
}

export function clearLog(): Promise<void> {
	localStorage.removeItem(key)
	return Promise.resolve()
}
