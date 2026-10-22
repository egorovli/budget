import type { Book } from '../book/model.ts'
import { accountBalance, freeAmount, toBase } from '../book/model.ts'
import { formatAmount } from '../book/money.ts'
import type { CommandDraft } from './draft.ts'
import { sameMerchant } from './rules.ts'

// Answers to questions from the command bar. They read the Book and save nothing.

const monthNames = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
]

function describePeriod(period: { from: string; to: string }): string {
	if (period.from === period.to) {
		return `on ${period.from}`
	}
	const sameMonth = period.from.slice(0, 7) === period.to.slice(0, 7)
	if (sameMonth && period.from.endsWith('-01')) {
		return `in ${monthNames[Number(period.from.slice(5, 7)) - 1]} ${period.from.slice(0, 4)}`
	}
	return `from ${period.from} to ${period.to}`
}

function free(book: Book): string {
	const result = freeAmount(book)
	const base = book.baseCurrency
	const text = `Free amount: ${formatAmount(result.free, base)}. Available money ${formatAmount(result.available, base)}, Reserves ${formatAmount(result.reserved, base)}.`
	return result.accountsWithoutBalance.length > 0 || result.currenciesWithoutRate.length > 0
		? `${text} Incomplete: some Accounts have no balance or rate.`
		: text
}

function balance(book: Book, accountId: string | null): string {
	const accounts = book.accounts.filter(item => accountId === null || item.id === accountId)
	return accounts
		.map(account => {
			const { amount, latest, difference } = accountBalance(book, account.id)
			if (amount === null) {
				return `${account.name}: no bank balance yet.`
			}
			const unrecorded =
				difference && difference !== '0'
					? ` Unrecorded difference ${formatAmount(difference, account.currency)}.`
					: ''
			return `${account.name}: ${formatAmount(amount, account.currency)}, bank balance of ${latest?.date}.${unrecorded}`
		})
		.join('\n')
}

function spent(book: Book, draft: CommandDraft): string {
	const period = draft.period
	if (!period) {
		return 'Say the period, for example “in October”.'
	}
	const accounts = new Map(book.accounts.map(account => [account.id, account]))
	const expenses = book.transactions.filter(
		item =>
			item.kind === 'expense' &&
			item.date >= period.from &&
			item.date <= period.to &&
			(draft.accountId === null || item.accountId === draft.accountId) &&
			(draft.note === null || sameMerchant(item.note, draft.note))
	)
	let total = 0n
	let skipped = 0
	for (const expense of expenses) {
		const account = accounts.get(expense.accountId)
		const converted = account ? toBase(book, expense.amount, account.currency) : null
		if (converted === null) {
			skipped += 1
		} else {
			total += BigInt(converted)
		}
	}
	const where = [
		draft.note ? ` at ${draft.note}` : '',
		draft.accountId ? ` from ${accounts.get(draft.accountId)?.name}` : ''
	].join('')
	const count = expenses.length === 1 ? '1 expense' : `${expenses.length} expenses`
	const missing = skipped > 0 ? ` ${skipped} without a rate are not included.` : ''
	return `Spent ${formatAmount(total.toString(), book.baseCurrency)}${where} ${describePeriod(period)} (${count}).${missing}`
}

function rate(book: Book, draft: CommandDraft): string {
	const rates = book.rates.filter(
		item => draft.currency === null || item.currency === draft.currency
	)
	if (rates.length === 0) {
		return draft.currency
			? `No rate for ${draft.currency}. Say “update rates”.`
			: 'No rates yet. Say “update rates”.'
	}
	return rates
		.map(
			item =>
				`1 ${item.currency} = ${item.value} ${book.baseCurrency} (${item.source}, ${item.date})`
		)
		.join('\n')
}

export function answer(book: Book, draft: CommandDraft): string {
	switch (draft.question) {
		case 'balance':
			return balance(book, draft.accountId)
		case 'spent':
			return spent(book, draft)
		case 'rate':
			return rate(book, draft)
		default:
			return free(book)
	}
}
