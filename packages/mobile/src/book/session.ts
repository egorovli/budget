import type { Book } from './model.ts'
import { demo, validateBook } from './model.ts'
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
	update(change: (book: Book) => Book): Promise<void> {
		const pending = this.queue.then(async () => {
			if (!this.book) {
				throw new Error('Book is not loaded.')
			}
			const next = validateBook({ ...change(this.book), revision: this.book.revision + 1 })
			await this.storage.commit(next, this.book.revision)
			this.book = next
			this.publish(next)
		})
		this.queue = pending.catch(() => undefined)
		return pending
	}
}
