import type { Book } from './model.ts'
import { validateBook } from './model.ts'

// Browser development storage. The same snapshot and revision rules as the native adapter.

function database(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('budget', 1)
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
			reject(new Error('Close other Sort of Budget tabs and retry.'))
		}
	})
}

export async function load(): Promise<Book | null> {
	const db = await database()
	try {
		return await new Promise((resolve, reject) => {
			const tx = db.transaction('snapshots', 'readonly')
			const request = tx.objectStore('snapshots').get('book')
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
			const request = store.get('book')
			request.onsuccess = () => {
				const current = request.result as Book | undefined
				if ((current?.revision ?? null) === expected) {
					store.put(next, 'book')
				} else {
					failure = new Error('Newer data exists in another tab. Reload and retry.')
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
