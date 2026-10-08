import type { SourceDataset } from './source.ts'
import { validateSource } from './source.ts'
import { openDatabaseAsync } from 'expo-sqlite'
import type { Book } from './model.ts'
import { validateBook } from './model.ts'
async function database() {
	const db = await openDatabaseAsync('budgetly-prototype.db')
	await db.execAsync(
		'CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, value TEXT NOT NULL, revision INTEGER NOT NULL)'
	)
	return db
}
export async function load(): Promise<Book | null> {
	const db = await database()
	const row = await db.getFirstAsync<{ value: string }>(
		'SELECT value FROM snapshots WHERE id = ?',
		'working'
	)
	return row ? validateBook(JSON.parse(row.value)) : null
}
export async function commit(next: Book, expected: number | null): Promise<void> {
	validateBook(next)
	const db = await database()
	await db.withExclusiveTransactionAsync(async tx => {
		const current = await tx.getFirstAsync<{ revision: number; value: string }>(
			'SELECT revision, value FROM snapshots WHERE id = ?',
			'working'
		)
		if (current) {
			validateBook(JSON.parse(current.value))
		}
		if ((current?.revision ?? null) !== expected) {
			throw new Error('Newer data exists. Keep your draft, reload and retry.')
		}
		await tx.runAsync(
			'INSERT OR REPLACE INTO snapshots (id, value, revision) VALUES (?, ?, ?)',
			'working',
			JSON.stringify(next),
			next.revision
		)
	})
}
export async function loadSource(): Promise<SourceDataset | null> {
	const db = await database()
	const row = await db.getFirstAsync<{ value: string }>(
		'SELECT value FROM snapshots WHERE id = ?',
		'source'
	)
	return row ? validateSource(JSON.parse(row.value)) : null
}
export async function storeSource(value: unknown): Promise<void> {
	if (value !== null) {
		validateSource(value)
	}
	const db = await database()
	await db.withExclusiveTransactionAsync(async tx => {
		if (value === null) {
			await tx.runAsync('DELETE FROM snapshots WHERE id = ?', 'source')
		} else {
			await tx.runAsync(
				'INSERT OR REPLACE INTO snapshots (id, value, revision) VALUES (?, ?, ?)',
				'source',
				JSON.stringify(value),
				0
			)
		}
	})
}
