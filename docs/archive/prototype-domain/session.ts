import type { Book } from './model.ts'
import { demo, requireValue, validateBook } from './model.ts'
export interface Storage {
	load(): Promise<Book | null>
	commit(next: Book, expected: number | null): Promise<void>
}
export class BookSession {
	book: Book | null = null
	private queue: Promise<void> = Promise.resolve()
	constructor(
		private storage: Storage,
		private publish: (book: Book) => void
	) {}
	async open() {
		let book = await this.storage.load()
		if (book === null) {
			book = JSON.parse(JSON.stringify(demo)) as Book
			await this.storage.commit(book, null)
		}
		this.book = validateBook(book)
		this.publish(this.book)
	}
	update(change: (book: Book) => Book): Promise<{ before: Book; after: Book }> {
		const pending = this.queue.then(async () => {
			if (!this.book) {
				throw new Error('Book is not loaded.')
			}
			const before = this.book
			const next = validateBook({ ...change(before), revision: before.revision + 1 })
			await this.storage.commit(next, before.revision)
			this.book = next
			this.publish(next)
			return { before, after: next }
		})
		this.queue = pending.then(
			() => undefined,
			() => undefined
		)
		return pending
	}
	undo(before: Book, after: Book) {
		return this.update(current => {
			requireValue(
				current.revision === after.revision,
				'The Book changed after this action. Undo is no longer available.'
			)
			return before
		})
	}
}
