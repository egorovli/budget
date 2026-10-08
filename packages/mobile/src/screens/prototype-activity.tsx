import type { ActivityFilter, Book } from '~/book/model.ts'
import { categoryPath, filterTransactions, formatAmount } from '~/book/model.ts'
import { Note, RowLink } from '~/components/prototype-ui.tsx'
import { transactionHref } from './prototype-routes.ts'
export function ActivityRows({ book, filter = {} }: { book: Book; filter?: ActivityFilter }) {
	const transactions = filterTransactions(book, filter)
	const transfers = (book.transfers ?? []).filter(
		item =>
			(!filter.accountId || item.fromId === filter.accountId || item.toId === filter.accountId) &&
			!filter.categoryId &&
			!filter.counterpartyId &&
			(!filter.from || item.date >= filter.from) &&
			(!filter.to || item.date <= filter.to) &&
			(!filter.text ||
				`${item.note} Transfer ${book.accounts.find(account => account.id === item.fromId)?.name} ${book.accounts.find(account => account.id === item.toId)?.name}`
					.toLowerCase()
					.includes(filter.text.toLowerCase()))
	)
	const rows = [
		...transactions.map(item => ({
			id: item.id,
			date: item.date,
			transaction: item,
			transfer: null
		})),
		...transfers.map(item => ({ id: item.id, date: item.date, transaction: null, transfer: item }))
	].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
	if (!rows.length) {
		return <Note>No activity matches these filters.</Note>
	}
	return (
		<>
			{rows.map(row => {
				if (row.transaction) {
					const item = row.transaction
					const account = book.accounts.find(record => record.id === item.accountId)
					const party = book.counterparties.find(record => record.id === item.counterpartyId)
					return (
						<RowLink
							key={item.id}
							href={transactionHref(book.id, item.id)}
							label={party?.name || item.note || item.type}
							detail={`${item.date} · ${account?.name} · ${categoryPath(book, item.categoryId ?? '') || 'Uncategorized'}${item.original ? ` · Original ${formatAmount(item.original.amount, item.original.currency)}` : ''}`}
							value={`${item.type === 'Expense' ? '-' : '+'}${formatAmount(item.amount, account?.currency ?? 'PLN')}`}
						/>
					)
				}
				const item = row.transfer
				if (!item) {
					return null
				}
				const from = book.accounts.find(account => account.id === item.fromId)
				const to = book.accounts.find(account => account.id === item.toId)
				let transferValue = `${formatAmount(item.sent, from?.currency ?? 'PLN')} / ${formatAmount(item.received, to?.currency ?? 'PLN')}`
				if (filter.accountId === item.fromId) {
					transferValue = `-${formatAmount(item.sent, from?.currency ?? 'PLN')}`
				}
				if (filter.accountId === item.toId) {
					transferValue = `+${formatAmount(item.received, to?.currency ?? 'PLN')}`
				}

				return (
					<RowLink
						key={item.id}
						href={{
							pathname: '/books/[book-id]/transfers/[id]',
							params: { 'book-id': book.id, id: item.id }
						}}
						label={`${from?.name} → ${to?.name}`}
						detail={`${item.date} · Transfer · ${item.note}`}
						value={transferValue}
					/>
				)
			})}
		</>
	)
}
