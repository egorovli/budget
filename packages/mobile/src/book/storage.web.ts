import type { SourceDataset } from './source.ts'
import { validateSource } from './source.ts'
import type { Book } from './model.ts'
import { validateBook } from './model.ts'
function database(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('budgetly-prototype', 1)
		request.onupgradeneeded = () => {
			request.result.createObjectStore('snapshots')
		}
		request.onsuccess = () => {
			resolve(request.result)
		}
		request.onerror = () => {
			reject(request.error ?? new Error('Local storage is unavailable.'))
		}
		request.onblocked = () => {
			reject(new Error('Close other prototype tabs and retry.'))
		}
	})
}
export async function load(): Promise<Book | null> {
	const db = await database()
	try {
		return await new Promise((resolve, reject) => {
			const tx = db.transaction('snapshots', 'readonly')
			const request = tx.objectStore('snapshots').get('working')
			tx.oncomplete = () => {
				try {
					resolve(request.result === undefined ? null : validateBook(request.result))
				} catch (error) {
					reject(error)
				}
			}
			tx.onabort = () => {
				reject(tx.error ?? new Error('Cannot read the saved Book.'))
			}
		})
	} finally {
		db.close()
	}
}
export async function commit(next: Book, expected: number | null): Promise<void> {
	validateBook(next)
	const db = await database()
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction('snapshots', 'readwrite')
			const store = tx.objectStore('snapshots')
			let failure: Error | undefined
			const request = store.get('working')
			request.onsuccess = () => {
				try {
					if (request.result !== undefined) {
						validateBook(request.result)
					}
					if ((request.result?.revision ?? null) !== expected) {
						throw new Error(
							'Newer data exists in another tab. Reload saved data, review your input and retry.'
						)
					}
					store.put(next, 'working')
				} catch (reason) {
					failure =
						reason instanceof Error ? reason : new Error('Write failed. Keep your input and retry.')
					tx.abort()
				}
			}
			tx.oncomplete = () => {
				resolve()
			}
			tx.onabort = () => {
				reject(failure ?? tx.error ?? new Error('Write failed. Your input is unchanged; retry.'))
			}
		})
	} finally {
		db.close()
	}
}
export async function loadSource(): Promise<SourceDataset | null> {
	const db = await database()
	try {
		return await new Promise((resolve, reject) => {
			const tx = db.transaction('snapshots', 'readonly')
			const request = tx.objectStore('snapshots').get('source')
			tx.oncomplete = () => {
				try {
					resolve(request.result === undefined ? null : validateSource(request.result))
				} catch (error) {
					reject(error)
				}
			}
			tx.onabort = () => reject(tx.error ?? new Error('Cannot load source data.'))
		})
	} finally {
		db.close()
	}
}
export async function storeSource(value: unknown): Promise<void> {
	if (value !== null) {
		validateSource(value)
	}
	const db = await database()
	try {
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction('snapshots', 'readwrite')
			const store = tx.objectStore('snapshots')
			if (value === null) {
				store.delete('source')
			} else {
				store.put(value, 'source')
			}
			tx.oncomplete = () => resolve()
			tx.onabort = () => reject(tx.error ?? new Error('Cannot save source data.'))
		})
	} finally {
		db.close()
	}
}
