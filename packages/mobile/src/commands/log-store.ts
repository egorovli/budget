import { openDatabaseAsync } from 'expo-sqlite'
import type { LogEntry } from './log.ts'
import { logLimit } from './log.ts'

// The command log in its own table of the app database. The Book snapshot never includes it.

async function database() {
	const db = await openDatabaseAsync('budgetly.db')
	await db.execAsync(
		'CREATE TABLE IF NOT EXISTS command_log (id TEXT PRIMARY KEY, at TEXT NOT NULL, value TEXT NOT NULL)'
	)
	return db
}

export async function loadLog(): Promise<LogEntry[]> {
	const db = await database()
	const rows = await db.getAllAsync<{ value: string }>(
		'SELECT value FROM command_log ORDER BY at DESC LIMIT ?',
		logLimit
	)
	return rows.map(row => JSON.parse(row.value) as LogEntry)
}

export async function saveLogEntry(entry: LogEntry): Promise<void> {
	const db = await database()
	await db.withExclusiveTransactionAsync(async tx => {
		await tx.runAsync(
			'INSERT OR REPLACE INTO command_log (id, at, value) VALUES (?, ?, ?)',
			entry.id,
			entry.at,
			JSON.stringify(entry)
		)
		await tx.runAsync(
			'DELETE FROM command_log WHERE id NOT IN (SELECT id FROM command_log ORDER BY at DESC LIMIT ?)',
			logLimit
		)
	})
}

export async function clearLog(): Promise<void> {
	const db = await database()
	await db.runAsync('DELETE FROM command_log')
}
