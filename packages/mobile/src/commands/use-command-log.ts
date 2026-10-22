import { useEffect, useSyncExternalStore } from 'react'
import type { LogEntry } from './log.ts'
import { appended } from './log.ts'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects log-store.web.ts on web
import { clearLog, loadLog, saveLogEntry } from './log-store'

// One in-memory copy of the command log for all screens; storage keeps it between launches.

let entries: LogEntry[] = []
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit() {
	for (const listener of listeners) {
		listener()
	}
}

function load() {
	loading ??= loadLog()
		.then(stored => {
			// Entries recorded before the load finished stay on top.
			entries = [...entries, ...stored.filter(item => !entries.some(entry => entry.id === item.id))]
			emit()
		})
		.catch(() => undefined)
	return loading
}

/** Adds an entry. A storage failure never blocks a command. */
export function recordCommand(entry: LogEntry): void {
	entries = appended(entries, entry)
	emit()
	saveLogEntry(entry).catch(() => undefined)
}

export function useCommandLog() {
	useEffect(() => {
		void load()
	}, [])
	const current = useSyncExternalStore(
		listener => {
			listeners.add(listener)
			return () => listeners.delete(listener)
		},
		() => entries
	)
	const clear = async () => {
		await clearLog()
		entries = []
		emit()
	}
	return { entries: current, clear }
}
