import { openDatabaseAsync } from 'expo-sqlite'
import type { Book } from './model.ts'
import { validateBook } from './model.ts'

// The Book is one snapshot. A commit replaces it atomically and checks the expected revision,
// so that a stale screen cannot overwrite newer data.

async function database() {
	const db = await openDatabaseAsync('budgetly.db')
	await db.execAsync(
		'CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, value TEXT NOT NULL, revision INTEGER NOT NULL)'
	)
	return db
}

export async function load(): Promise<Book | null> {
	const db = await database()
	const row = await db.getFirstAsync<{ value: string }>(
		'SELECT value FROM snapshots WHERE id = ?',
		'book'
	)
	return row ? validateBook(JSON.parse(row.value)) : null
}

export async function commit(next: Book, expected: number | null): Promise<void> {
	validateBook(next)
	const db = await database()
	await db.withExclusiveTransactionAsync(async tx => {
		const current = await tx.getFirstAsync<{ revision: number }>(
			'SELECT revision FROM snapshots WHERE id = ?',
			'book'
		)
		if ((current?.revision ?? null) !== expected) {
			throw new Error('Newer data exists. Reopen the app and retry.')
		}
		await tx.runAsync(
			'INSERT OR REPLACE INTO snapshots (id, value, revision) VALUES (?, ?, ?)',
			'book',
			JSON.stringify(next),
			next.revision
		)
	})
}
