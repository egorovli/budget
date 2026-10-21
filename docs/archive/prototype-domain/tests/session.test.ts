import { expect, test } from 'bun:test'
import { demo, saveTransaction, validateBook } from '../src/book/model.ts'
import { BookSession } from '../src/book/session.ts'
test('a failed write does not publish or replace the saved Book; retry works', async () => {
	let stored = structuredClone(demo)
	const failures = [new Error('disk full')]
	let shown = stored
	const session = new BookSession(
		{
			load: async () => stored,
			commit: async next => {
				const failure = failures.shift()
				if (failure) {
					throw failure
				}
				stored = next
			}
		},
		book => {
			shown = book
		}
	)
	await session.open()
	await expect(
		session.update(book => saveTransaction(book, { ...book.transactions[0], amount: '2000' }))
	).rejects.toThrow('disk full')
	expect(shown.transactions[0]?.amount).toBe('1234')
	expect(stored.revision).toBe(0)
	await session.update(book => saveTransaction(book, { ...book.transactions[0], amount: '2000' }))
	expect(shown.revision).toBe(1)
})
test('read failures and unsupported versions never seed or erase saved data', async () => {
	let writes = 0
	const session = new BookSession(
		{
			load: async () => {
				throw new Error('read failed')
			},
			commit: async () => {
				writes++
			}
		},
		() => undefined
	)
	await expect(session.open()).rejects.toThrow('read failed')
	expect(writes).toBe(0)
	expect(() => validateBook({ ...demo, schema: 2 })).toThrow('Unsupported')
	expect(() =>
		validateBook({ ...demo, transactions: [{ ...demo.transactions[0], amount: '1.23' }] })
	).toThrow()
})
test('undo restores the Book before an action only while nothing else changed', async () => {
	let stored = structuredClone(demo)
	const session = new BookSession(
		{
			load: async () => stored,
			commit: async next => {
				stored = next
			}
		},
		() => undefined
	)
	await session.open()
	const first = await session.update(book =>
		saveTransaction(book, { ...demo.transactions[0], amount: '2000' })
	)
	await session.undo(first.before, first.after)
	expect(stored.transactions.find(item => item.id === 'groceries')?.amount).toBe('1234')
	expect(stored.revision).toBe(2)
	const second = await session.update(book =>
		saveTransaction(book, { ...demo.transactions[0], amount: '3000' })
	)
	await session.update(book => saveTransaction(book, { ...demo.transactions[0], amount: '4000' }))
	await expect(session.undo(second.before, second.after)).rejects.toThrow(
		'Undo is no longer available'
	)
	expect(stored.transactions.find(item => item.id === 'groceries')?.amount).toBe('4000')
})
