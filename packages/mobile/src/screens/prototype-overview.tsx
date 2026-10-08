import { ActivityRows } from './prototype-activity.tsx'
import { useState } from 'react'
import { useBook } from '~/book/provider.tsx'
import type { Book, Transaction } from '~/book/model.ts'
import {
	categoryPath,
	filterTransactions,
	formatAmount,
	impliedRate,
	isDate,
	removeTransaction,
	removeTransfer,
	spending
} from '~/book/model.ts'
import {
	ActionLink,
	ConfirmButton,
	Field,
	Metric,
	Note,
	PrototypeScreen,
	Section,
	SelectField,
	StaticRow
} from '~/components/prototype-ui.tsx'
import { AccountsScreen } from './prototype-accounts.tsx'
import { activityHref } from './prototype-routes.ts'
export function HomeScreen({ bookId }: { bookId: string }) {
	return <AccountsScreen bookId={bookId} />
}
export function SpendingSummary({
	book,
	transactions
}: {
	book: Book
	transactions: Transaction[]
}) {
	const summary = spending(transactions, book)
	return (
		<Section title='Spending in selected period'>
			{Object.entries(summary.totals).map(([currency, amount]) => (
				<StaticRow
					key={currency}
					label={currency}
					value={formatAmount(amount, currency as Book['baseCurrency'])}
				/>
			))}
			{Object.keys(summary.totals).length === 0 ? <Note>No Expenses in this period.</Note> : null}
			{summary.base === null ? (
				<Note>
					{summary.missing} Expense(s) lack a stored conversion to {book.baseCurrency}. Per-currency
					totals are shown.
				</Note>
			) : (
				<StaticRow
					label={`Base currency · stored rates · rounded to cents`}
					value={formatAmount(summary.base, book.baseCurrency)}
				/>
			)}
		</Section>
	)
}
export function ActivityScreen(_props: { bookId: string }) {
	const { book } = useBook()
	const [text, setText] = useState('')
	const [accountId, setAccountId] = useState('')
	const [categoryId, setCategoryId] = useState('')
	const [counterpartyId, setCounterpartyId] = useState('')
	const [from, setFrom] = useState('')
	const [to, setTo] = useState('')
	const filter = { text, accountId, categoryId, counterpartyId, from, to }
	const valid = (!from || isDate(from)) && (!to || isDate(to)) && (!from || !to || from <= to)
	return (
		<PrototypeScreen
			title='Activity'
			description='Working Book. Same-day rows use stable IDs; their order does not imply an exact time.'
		>
			<ActionLink
				href={{ pathname: '/books/[book-id]/transactions/new', params: { 'book-id': book.id } }}
				label='Record transaction'
			/>
			<ActionLink
				href={{ pathname: '/books/[book-id]/transfers/new', params: { 'book-id': book.id } }}
				label='Transfer between Accounts'
				secondary
			/>
			<Field
				label='Search Activity'
				value={text}
				onChangeText={setText}
			/>
			<SelectField
				label='Account filter'
				value={accountId}
				options={[
					{ value: '', label: 'All Accounts' },
					...book.accounts.map(item => ({ value: item.id, label: item.name }))
				]}
				onChange={setAccountId}
			/>
			<SelectField
				label='Category filter · includes descendants'
				value={categoryId}
				options={[
					{ value: '', label: 'All Categories' },
					...book.categories.map(item => ({ value: item.id, label: categoryPath(book, item.id) }))
				]}
				onChange={setCategoryId}
			/>
			<SelectField
				label='Counterparty filter'
				value={counterpartyId}
				options={[
					{ value: '', label: 'All Counterparties' },
					...book.counterparties.map(item => ({ value: item.id, label: item.name }))
				]}
				onChange={setCounterpartyId}
			/>
			<Field
				label='From date · YYYY-MM-DD · optional'
				value={from}
				onChangeText={setFrom}
			/>
			<Field
				label='To date · YYYY-MM-DD · optional'
				value={to}
				onChangeText={setTo}
			/>
			{valid ? (
				<>
					<SpendingSummary
						book={book}
						transactions={filterTransactions(book, filter)}
					/>
					<Section title='Activity'>
						<ActivityRows
							book={book}
							filter={filter}
						/>
					</Section>
				</>
			) : (
				<Note>Enter valid dates in ascending order.</Note>
			)}
		</PrototypeScreen>
	)
}
export function TransactionDetailScreen({
	bookId,
	transactionId
}: {
	bookId: string
	transactionId: string
}) {
	const { book, update } = useBook()
	const transaction = book.transactions.find(item => item.id === transactionId)
	const account = book.accounts.find(item => item.id === transaction?.accountId)
	if (!transaction || !account) {
		return (
			<PrototypeScreen title='Transaction not found'>
				<ActionLink
					href={activityHref(book.id)}
					label='Open Activity'
				/>
			</PrototypeScreen>
		)
	}
	return (
		<PrototypeScreen
			title={transaction.type}
			description='Working Book · synthetic sample and manual records'
		>
			<Metric
				label='Posted amount'
				value={formatAmount(transaction.amount, account.currency)}
			/>
			<StaticRow
				label='Account'
				value={account.name}
			/>
			<StaticRow
				label='Transaction date'
				value={transaction.date}
			/>
			<StaticRow
				label='Category'
				value={categoryPath(book, transaction.categoryId ?? '') || 'None'}
			/>
			<StaticRow
				label='Counterparty'
				value={
					book.counterparties.find(item => item.id === transaction.counterpartyId)?.name ?? 'None'
				}
			/>
			{transaction.original ? (
				<StaticRow
					label='Original amount'
					value={formatAmount(transaction.original.amount, transaction.original.currency)}
				/>
			) : null}
			{transaction.rate ? (
				<StaticRow
					label='Recorded rate'
					value={`1 ${transaction.rate.from} = ${transaction.rate.value} ${transaction.rate.to} · ${transaction.rate.provenance}${transaction.rate.date ? ` · ${transaction.rate.date}` : ''}`}
				/>
			) : null}
			{transaction.original &&
			!transaction.rate &&
			transaction.original.currency !== account.currency ? (
				<StaticRow
					label='Inferred rate · rounded'
					value={`1 ${transaction.original.currency} = ${impliedRate(transaction.original.amount, transaction.amount)} ${account.currency}`}
				/>
			) : null}
			{transaction.occurredAt ? (
				<StaticRow
					label='Occurrence time'
					value={transaction.occurredAt}
				/>
			) : null}
			{transaction.location ? (
				<StaticRow
					label={`Expense location · ${transaction.location.simulated ? 'simulated' : 'recorded'}`}
					value={`${transaction.location.latitude}, ${transaction.location.longitude}`}
				/>
			) : null}
			<Note>{transaction.note || 'No note.'}</Note>
			<ActionLink
				href={{
					pathname: '/books/[book-id]/transactions/[id]/edit',
					params: { 'book-id': bookId, id: transactionId }
				}}
				label='Edit transaction'
			/>
			<ConfirmButton
				label='Remove transaction'
				explanation='Remove this manual Transaction? This changes the Account balance.'
				onConfirm={() => update(current => removeTransaction(current, transactionId))}
			/>
			<ActionLink
				href={activityHref(bookId)}
				label='Back to Activity'
				secondary
			/>
		</PrototypeScreen>
	)
}
export function TransferDetailScreen({ bookId, id }: { bookId: string; id: string }) {
	const { book, update } = useBook()
	const transfer = (book.transfers ?? []).find(item => item.id === id)
	const from = book.accounts.find(item => item.id === transfer?.fromId)
	const to = book.accounts.find(item => item.id === transfer?.toId)
	if (!transfer || !from || !to) {
		return (
			<PrototypeScreen title='Transfer not found'>
				<ActionLink
					href={activityHref(bookId)}
					label='Open Activity'
				/>
			</PrototypeScreen>
		)
	}
	return (
		<PrototypeScreen title='Transfer'>
			<StaticRow
				label={`Sent · ${from.name}`}
				value={formatAmount(transfer.sent, from.currency)}
			/>
			<StaticRow
				label={`Received · ${to.name}`}
				value={formatAmount(transfer.received, to.currency)}
			/>
			<StaticRow
				label='Transaction date'
				value={transfer.date}
			/>
			{from.currency === to.currency ? null : (
				<StaticRow
					label='Inferred rate · rounded'
					value={`1 ${from.currency} = ${impliedRate(transfer.sent, transfer.received)} ${to.currency}`}
				/>
			)}
			<Note>{transfer.note || 'No note.'}</Note>
			<ActionLink
				href={{
					pathname: '/books/[book-id]/transfers/[id]/edit',
					params: { 'book-id': bookId, id }
				}}
				label='Edit Transfer'
			/>
			<ConfirmButton
				label='Remove Transfer'
				explanation='Remove both sides of this Transfer?'
				onConfirm={() => update(current => removeTransfer(current, id))}
			/>
			<ActionLink
				href={activityHref(bookId)}
				label='Open Activity'
			/>
		</PrototypeScreen>
	)
}
export function MoreScreen({ bookId }: { bookId: string }) {
	return (
		<PrototypeScreen title='More'>
			<ActionLink
				href={{ pathname: '/books/[book-id]/categories', params: { 'book-id': bookId } }}
				label='Categories'
			/>
			<ActionLink
				href={{ pathname: '/books/[book-id]/counterparties', params: { 'book-id': bookId } }}
				label='Counterparties'
			/>
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
