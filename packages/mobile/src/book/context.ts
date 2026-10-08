import { createContext, useContext } from 'react'
import type { Book } from './model.ts'
export interface BookState {
	book: Book
	reload: () => Promise<void>
	update: (change: (book: Book) => Book) => Promise<void>
}
export const BookContext = createContext<BookState | null>(null)
export function useBook(): BookState {
	const value = useContext(BookContext)
	if (!value) {
		throw new Error('Book provider is missing.')
	}
	return value
}
