import { ActionLink, Note, PrototypeScreen } from '~/components/prototype-ui.tsx'
import { useBook } from '~/book/provider.tsx'
import { bookHref } from './prototype-routes.ts'
export function WelcomeScreen() {
	return (
		<PrototypeScreen
			title='Budgetly'
			description='Local working prototype'
		>
			<ActionLink
				href='/books'
				label='Select Book'
			/>
			<ActionLink
				href='/prototype/native-ui'
				label='Native UI experiment'
				secondary
			/>
			<Note>Synthetic sample data. No cloud sync.</Note>
		</PrototypeScreen>
	)
}
export function BooksScreen() {
	const { book } = useBook()
	return (
		<PrototypeScreen title='Books'>
			<ActionLink
				href={bookHref(book.id)}
				label={`Open ${book.name} · ${book.baseCurrency}`}
			/>
			<Note>One working Book. Private source data is loaded separately.</Note>
		</PrototypeScreen>
	)
}
export function BookFormScreen() {
	return <BooksScreen />
}
