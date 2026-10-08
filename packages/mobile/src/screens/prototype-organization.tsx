import { useRouter } from 'expo-router'
import { checkOfflineUpdate, activateOfflineUpdate } from '~/book/offline'
import { ActivityScreen, SpendingSummary } from './prototype-overview.tsx'
import { useState } from 'react'
import type { Book } from '~/book/model.ts'
import {
	validateBook,
	demo,
	simulate,
	dismissCapture,
	categoryPath,
	filterTransactions
} from '~/book/model.ts'
import { storeSource } from '~/book/storage'
import { validateSource } from '~/book/source.ts'
import { readJSON, exportJSON } from '~/book/files'
import {
	ActionLink,
	ActionButton,
	ConfirmButton,
	useAction,
	Note,
	PrototypeScreen,
	RowLink,
	Section,
	Field
} from '~/components/prototype-ui.tsx'
import { useBook } from '~/book/provider.tsx'

export function CategoriesScreen({ bookId }: { bookId: string }) {
	const { book } = useBook()
	const [parentId, setParentId] = useState<string | null>(null)
	const [search, setSearch] = useState('')
	const parent = book.categories.find(item => item.id === parentId)
	const items = book.categories.filter(item =>
		search
			? categoryPath(book, item.id).toLowerCase().includes(search.toLowerCase())
			: item.parentId === parentId
	)
	return (
		<PrototypeScreen
			title='Categories'
			description='Every Category can classify a Transaction, including a parent.'
		>
			<Field
				label='Search Categories'
				value={search}
				onChangeText={setSearch}
			/>
			<Note>Path: {parentId ? categoryPath(book, parentId) : 'All Categories'}</Note>
			<ActionButton
				label='All Categories'
				onPress={() => {
					setParentId(null)
					setSearch('')
				}}
			/>
			{parent ? (
				<>
					<ActionButton
						label='Parent path'
						onPress={() => setParentId(parent.parentId)}
					/>
					<ActionLink
						href={{
							pathname: '/books/[book-id]/categories/[id]/edit',
							params: { 'book-id': bookId, id: parent.id }
						}}
						label='Edit current Category'
					/>
				</>
			) : null}
			{items.length ? (
				items.map(item => (
					<Section
						key={item.id}
						title={search ? categoryPath(book, item.id) : item.name}
					>
						<ActionLink
							href={{
								pathname: '/books/[book-id]/categories/[id]/edit',
								params: { 'book-id': bookId, id: item.id }
							}}
							label={`Edit ${item.name}`}
							secondary
						/>
						<ActionButton
							label={`Open path: ${item.name}`}
							onPress={() => {
								setParentId(item.id)
								setSearch('')
							}}
						/>
						<SpendingSummary
							book={book}
							transactions={filterTransactions(book, { categoryId: item.id })}
						/>
					</Section>
				))
			) : (
				<Note>No Categories in this path.</Note>
			)}
			<ActionLink
				href={{ pathname: '/books/[book-id]/categories/new', params: { 'book-id': bookId } }}
				label='Create Category'
			/>
		</PrototypeScreen>
	)
}
export function CounterpartiesScreen({ bookId }: { bookId: string }) {
	const { book } = useBook()
	const [search, setSearch] = useState('')
	const items = book.counterparties.filter(item =>
		item.name.toLowerCase().includes(search.toLowerCase())
	)
	return (
		<PrototypeScreen title='Counterparties'>
			<Field
				label='Search Counterparties'
				value={search}
				onChangeText={setSearch}
			/>
			{items.map(item => (
				<RowLink
					key={item.id}
					label={item.name}
					href={{
						pathname: '/books/[book-id]/counterparties/[id]/edit',
						params: { 'book-id': bookId, id: item.id }
					}}
				/>
			))}
			{items.length ? null : <Note>No Counterparties match.</Note>}
			<ActionLink
				href={{ pathname: '/books/[book-id]/counterparties/new', params: { 'book-id': bookId } }}
				label='Create Counterparty'
			/>
		</PrototypeScreen>
	)
}
export function ReportsScreen({ bookId }: { bookId: string }) {
	return <ActivityScreen bookId={bookId} />
}
export function BookSettingsScreen({ bookId }: { bookId: string }) {
	return (
		<PrototypeScreen title='Book settings'>
			<ActionLink
				href={{
					pathname: '/books/[book-id]/settings/data-and-sync',
					params: { 'book-id': bookId }
				}}
				label='Prototype data'
			/>
		</PrototypeScreen>
	)
}
export function DataAndSyncScreen(_props: { bookId: string }) {
	const router = useRouter()
	const { book, update } = useBook()
	const [status, setStatus] = useState('')
	const [restore, setRestore] = useState<Book | null>(null)
	const action = useAction()
	return (
		<PrototypeScreen title='Prototype data'>
			<Section title='Offline shell'>
				<Note>
					Development uses Fast Refresh. The exported preview caches application assets after its
					first successful load. Financial data stays in the local database. Finish forms and export
					before activating an update.
				</Note>
				<ActionButton
					label='Check offline shell update'
					onPress={() =>
						action.run(async () => {
							setStatus(await checkOfflineUpdate())
						})
					}
				/>
				<ConfirmButton
					label='Activate downloaded shell update'
					explanation='Reload the exported application with the downloaded shell? Finish other open forms first.'
					onConfirm={activateOfflineUpdate}
				/>
				{status ? <Note>{status}</Note> : null}
			</Section>
			<ConfirmButton
				label='Reset working demo'
				explanation='Export the working Book first if you need it. Reset replaces only the working Book with sample data. Loaded source data and the original source file stay intact.'
				onConfirm={async () => {
					await update(() => JSON.parse(JSON.stringify(demo)) as Book)
					router.replace({
						pathname: '/books/[book-id]/settings/data-and-sync',
						params: { 'book-id': demo.id }
					})
				}}
			/>
			<ConfirmButton
				label='Remove loaded source data'
				explanation='Remove only the separately loaded preview? The working Book and the original file on disk stay intact.'
				onConfirm={() => storeSource(null)}
			/>
			<Section title='Simulate incoming transaction'>
				<Note>Fixed synthetic events. Replay uses the same event ID.</Note>
				{(['ordinary', 'foreign', 'incomplete'] as const).map(example => (
					<ActionButton
						key={example}
						label={`Simulate ${example} purchase`}
						onPress={() => action.run(() => update(current => simulate(current, example)))}
						disabled={action.busy}
					/>
				))}
			</Section>
			<Section title='Pending capture drafts'>
				{(book.pending ?? []).map(draft => (
					<Section
						key={draft.eventId}
						title={draft.note}
					>
						<ActionLink
							href={{
								pathname: '/books/[book-id]/transactions/new',
								params: { 'book-id': book.id, eventId: draft.eventId }
							}}
							label='Review capture draft'
						/>
						<ConfirmButton
							label='Dismiss capture draft'
							explanation='Discard this pending draft without changing balances?'
							onConfirm={() => update(current => dismissCapture(current, draft.eventId))}
						/>
					</Section>
				))}
				{book.pending?.length ? null : <Note>No pending capture drafts.</Note>}
			</Section>
			<ActionButton
				label='Load optional normalized source JSON'
				onPress={() =>
					action.run(async () => {
						const source = validateSource(await readJSON())
						await storeSource(source)
					})
				}
				disabled={action.busy}
			/>
			<ActionLink
				href={{
					pathname: '/books/[book-id]/settings/source-preview',
					params: { 'book-id': book.id }
				}}
				label='Open read-only source preview'
				secondary
			/>
			<Note>
				Working Book: {book.name}. Browser data can be cleared. Export is the recovery path. Data
				and exports are not encrypted. No cloud sync.
			</Note>
			<ActionButton
				label='Export working Book'
				onPress={() => action.run(() => exportJSON(book))}
				disabled={action.busy}
			/>
			<ActionButton
				label='Choose Book snapshot to restore'
				onPress={() =>
					action.run(async () => {
						setRestore(validateBook(await readJSON()))
					})
				}
				disabled={action.busy}
			/>
			{restore ? (
				<>
					<Note>
						Selected {restore.name}: {restore.accounts.length} Accounts,{' '}
						{restore.transactions.length} Transactions. Restore replaces the working Book.
					</Note>
					<ConfirmButton
						label='Restore working Book'
						explanation='Export first if you need the current Book. Replace it with this validated snapshot?'
						onConfirm={async () => {
							await update(() => restore)
							router.replace({
								pathname: '/books/[book-id]/settings/data-and-sync',
								params: { 'book-id': restore.id }
							})
							setRestore(null)
						}}
					/>
					<ActionButton
						label='Cancel restore'
						onPress={() => setRestore(null)}
					/>
				</>
			) : null}
			{action.error ? <Note>{action.error}</Note> : null}
		</PrototypeScreen>
	)
}
