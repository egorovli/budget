import { balance, demo, requireValue, saveTransaction, validateBook } from '../src/book/model.ts'
import { BookSession } from '../src/book/session.ts'
import { commit, load } from '../src/book/storage.web.ts'
async function expectRejected(action: () => Promise<unknown>, message: string) {
	let rejected = false
	try {
		await action()
	} catch {
		rejected = true
	}
	requireValue(rejected, message)
}
export async function runBrowserStorageChecks() {
	const original = await load()
	requireValue(original, 'Load the prototype first.')
	const first = { ...JSON.parse(JSON.stringify(demo)), revision: original.revision + 1 }
	const results: string[] = []
	try {
		await commit(first, original.revision)
		const stale = { ...first, revision: first.revision + 1 }
		await expectRejected(
			() => commit(stale, original.revision),
			'A stale revision overwrote newer data.'
		)
		requireValue(
			(await load())?.revision === first.revision,
			'The stale write changed saved state.'
		)
		results.push('IndexedDB rejects stale revisions atomically')
		await expectRejected(
			() => commit({ ...first, schema: 2 } as unknown as typeof first, first.revision),
			'Unsupported schema was written.'
		)
		await expectRejected(
			() =>
				commit(
					{ ...first, transactions: [{ ...first.transactions[0], amount: 'bad' }] },
					first.revision
				),
			'Corrupt data was written.'
		)
		requireValue((await load())?.revision === first.revision, 'Invalid writes changed saved state.')
		results.push('Invalid and unsupported snapshots preserve saved data')
		const db = await new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open('budgetly-prototype', 1)
			request.onsuccess = () => resolve(request.result)
			request.onerror = () => reject(request.error)
		})
		const rawWrite = (value: unknown) =>
			new Promise<void>((resolve, reject) => {
				const tx = db.transaction('snapshots', 'readwrite')
				tx.objectStore('snapshots').put(value, 'working')
				tx.oncomplete = () => resolve()
				tx.onabort = () => reject(tx.error)
			})
		try {
			await rawWrite({ ...first, schema: 2 })
			await expectRejected(() => load(), 'An unsupported saved schema was loaded.')
			await expectRejected(
				() => commit(stale, first.revision),
				'An older open tab overwrote a future schema.'
			)
			results.push('An open older tab cannot overwrite an unsupported saved schema')
		} finally {
			await rawWrite(first)
			db.close()
		}

		let published = first
		const session = new BookSession({ load, commit }, book => {
			published = book
		})
		await session.open()
		const nativeOpen = indexedDB.open
		indexedDB.open = () => {
			throw new DOMException('Storage unavailable for failure check', 'QuotaExceededError')
		}
		try {
			await expectRejected(
				() =>
					session.update(book =>
						saveTransaction(book, { ...book.transactions[0], amount: '2000' })
					),
				'Unavailable storage reported success.'
			)
		} finally {
			indexedDB.open = nativeOpen
		}
		requireValue(
			published.revision === first.revision && (await load())?.revision === first.revision,
			'A failed write published or replaced data.'
		)
		results.push('Unavailable storage preserves the published and saved Book')
		await session.update(book => saveTransaction(book, { ...book.transactions[0], amount: '2000' }))
		requireValue(balance(published, 'mbank') === '108000', 'Retry calculated the wrong balance.')
		const exported = validateBook(JSON.parse(JSON.stringify(published)))
		await session.update(() => JSON.parse(JSON.stringify(demo)))
		await session.update(() => exported)
		requireValue(balance(published, 'mbank') === '108000', 'Restore changed the balance.')
		results.push('Export, reset, restore and retry work on real IndexedDB')
	} finally {
		const latest = await load()
		requireValue(latest, 'The saved Book disappeared during checks.')
		await commit({ ...original, revision: latest.revision + 1 }, latest.revision)
	}
	return results
}
declare global {
	interface Window {
		budgetlyStorageChecks: typeof runBrowserStorageChecks
	}
}
window.budgetlyStorageChecks = runBrowserStorageChecks
