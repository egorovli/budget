import { randomUUID } from 'expo-crypto'
import type { ReactNode } from 'react'
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Book } from './model.ts'
import { createBook, setRates, today, validateBook } from './model.ts'
import { fetchRates } from './rates.ts'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects storage.web.ts on web
import { commit, load } from './storage'

interface BookState {
	book: Book | null
	error: string | null
	/** Applies a command to the current Book and saves the result before it is shown. */
	update: (command: (book: Book) => Book) => Promise<void>
	/** Replaces the Book with a restored snapshot. */
	restore: (value: unknown) => Promise<void>
	refreshRates: () => Promise<void>
}

const BookContext = createContext<BookState | null>(null)

export function newId(): string {
	return randomUUID()
}

export function useBook(): BookState & { book: Book } {
	const state = use(BookContext)
	if (!state?.book) {
		throw new Error('useBook needs a loaded Book.')
	}
	return { ...state, book: state.book }
}

function message(error: unknown): string {
	return error instanceof Error ? error.message : 'Unexpected error.'
}

export function BookProvider({ children }: { children: ReactNode }) {
	const [book, setBook] = useState<Book | null>(null)
	const [error, setError] = useState<string | null>(null)
	const savedBook = useRef<Book | null>(null)
	const queue = useRef<Promise<void>>(Promise.resolve())

	// Commands run one at a time, so that each one starts from the latest saved Book.
	const run = useCallback((task: (book: Book) => Book) => {
		const result = queue.current.then(async () => {
			const previous = savedBook.current
			if (!previous) {
				throw new Error('The Book is not loaded yet.')
			}
			const next = task(previous)
			await commit(next, previous.revision)
			savedBook.current = next
			setBook(next)
		})
		queue.current = result.catch(() => undefined)
		return result
	}, [])

	const refreshRates = useCallback(async () => {
		const rates = await fetchRates()
		await run(current => setRates(current, rates))
	}, [run])

	useEffect(() => {
		let active = true
		load()
			.then(async stored => {
				let loaded = stored
				if (!loaded) {
					loaded = createBook(newId())
					await commit(loaded, null)
				}
				if (active) {
					savedBook.current = loaded
					setBook(loaded)
				}
				// Rates are best effort: without a network the stored rates stay in use.
				if (active && !loaded.rates.some(rate => rate.date === today())) {
					await refreshRates().catch(() => undefined)
				}
			})
			.catch((reason: unknown) => {
				setError(message(reason))
			})
		return () => {
			active = false
		}
	}, [refreshRates])

	const value = useMemo<BookState>(
		() => ({
			book,
			error,
			update: run,
			restore: input => {
				const restored = validateBook(input)
				return run(previous => ({ ...restored, revision: previous.revision + 1 }))
			},
			refreshRates
		}),
		[book, error, run, refreshRates]
	)

	return <BookContext value={value}>{children}</BookContext>
}

export function useBookStatus(): { ready: boolean; error: string | null } {
	const state = use(BookContext)
	return { ready: Boolean(state?.book), error: state?.error ?? null }
}
