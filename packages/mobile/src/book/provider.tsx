import { Link } from 'expo-router'
import { Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { ActionButton, Note } from '~/components/prototype-ui.tsx'
import type { Book } from './model.ts'
import { BookSession } from './session.ts'
import * as storage from './storage'
import { BookContext } from './context.ts'
export { useBook } from './context.ts'
export function BookProvider({ children }: PropsWithChildren) {
	const [book, setBook] = useState<Book | null>(null)
	const [hiddenEvent, setHiddenEvent] = useState('')
	const [error, setError] = useState('')
	const [session] = useState(() => new BookSession(storage, setBook))
	const open = () => {
		setError('')
		void session.open().catch(reason => setError(String(reason)))
	}
	useEffect(open, [session])
	if (!book) {
		return (
			<View style={{ padding: 24 }}>
				<Text>{error ? 'Saved data cannot load' : 'Loading Book'}</Text>
				<Note>{error || 'Reading local storage…'}</Note>
				{error ? (
					<ActionButton
						label='Retry load'
						onPress={open}
					/>
				) : null}
			</View>
		)
	}

	return (
		<BookContext.Provider
			value={{ book, reload: () => session.open(), update: change => session.update(change) }}
		>
			<View style={{ flex: 1 }}>
				{book.pending?.[0] && hiddenEvent !== book.pending[0].eventId ? (
					<View style={{ padding: 12 }}>
						<Link
							href={{
								pathname: '/books/[book-id]/transactions/new',
								params: { 'book-id': book.id, eventId: book.pending[0].eventId }
							}}
						>
							Synthetic incoming transaction: review draft
						</Link>
						<ActionButton
							label='Dismiss notification'
							onPress={() => setHiddenEvent(book.pending?.[0]?.eventId ?? '')}
						/>
					</View>
				) : null}
				{children}
			</View>
		</BookContext.Provider>
	)
}
