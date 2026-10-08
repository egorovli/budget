import { ActivityRows } from './prototype-activity.tsx'
import { useBook } from '~/book/provider.tsx'
import {
	ActionLink,
	Metric,
	Note,
	PrototypeScreen,
	RowLink,
	Section
} from '~/components/prototype-ui.tsx'
import { balance, formatAmount } from '~/book/model.ts'
import { accountHref, accountsHref } from './prototype-routes.ts'

export function AccountsScreen({ bookId }: { bookId: string }) {
	const { book } = useBook()
	return (
		<PrototypeScreen
			title='Accounts'
			description='Synthetic sample data. Balances are calculated from Opening balances and activity.'
		>
			<Section title={book.name}>
				{book.accounts.map(account => (
					<RowLink
						key={account.id}
						href={accountHref(bookId, account.id)}
						label={account.name}
						detail={
							account.opening === null
								? `${account.currency} · Net movement · Opening balance unknown`
								: account.currency
						}
						value={formatAmount(balance(book, account.id), account.currency)}
					/>
				))}
			</Section>
			<ActionLink
				href={{ pathname: '/books/[book-id]/accounts/new', params: { 'book-id': bookId } }}
				label='Create Account'
			/>
			<ActionLink
				href={{ pathname: '/books/[book-id]/transfers/new', params: { 'book-id': bookId } }}
				label='Transfer between Accounts'
				secondary
			/>
		</PrototypeScreen>
	)
}
export function AccountDetailScreen({ bookId, accountId }: { bookId: string; accountId: string }) {
	const { book } = useBook()
	const account = book.accounts.find(item => item.id === accountId)
	if (!account || bookId !== book.id) {
		return (
			<PrototypeScreen title='Account not found'>
				<ActionLink
					href={accountsHref(book.id)}
					label='Open Accounts'
				/>
			</PrototypeScreen>
		)
	}
	return (
		<PrototypeScreen
			title={account.name}
			description='Synthetic sample data'
		>
			<Metric
				label={
					account.opening === null ? 'Net movement · Opening balance unknown' : 'Account balance'
				}
				value={formatAmount(balance(book, accountId), account.currency)}
			/>
			<ActionLink
				href={{
					pathname: '/books/[book-id]/transactions/new',
					params: { 'book-id': bookId, accountId }
				}}
				label='Record transaction'
			/>
			<ActionLink
				href={{
					pathname: '/books/[book-id]/accounts/[id]/edit',
					params: { 'book-id': bookId, id: accountId }
				}}
				label='Edit Account'
			/>
			<Section title='Account activity'>
				<ActivityRows
					book={book}
					filter={{ accountId }}
				/>
			</Section>
			<ActionLink
				href={accountsHref(bookId)}
				label='Back to Accounts'
				secondary
			/>
		</PrototypeScreen>
	)
}
export function BalanceAdjustmentScreen(_props: { bookId: string; accountId: string }) {
	return (
		<PrototypeScreen title='Balance adjustment experiment'>
			<Note>Outside the working prototype.</Note>
		</PrototypeScreen>
	)
}
export function ValuationSnapshotScreen(_props: { bookId: string; accountId: string }) {
	return (
		<PrototypeScreen title='Valuation experiment'>
			<Note>Outside the working prototype.</Note>
		</PrototypeScreen>
	)
}
