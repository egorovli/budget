import type { useRouter } from 'expo-router'
import type { Book } from '../book/model.ts'
import { toBase } from '../book/model.ts'
import type { Currency } from '../book/money.ts'
import { convert, formatAmount, formatInput } from '../book/money.ts'
import type { CommandDraft, InterpreterContext } from './draft.ts'

// Opens the confirmation form for a draft. Nothing is saved here: the form saves only after the
// user taps Save.

export function interpreterContext(book: Book, today: string): InterpreterContext {
	return {
		accounts: book.accounts,
		reserves: book.reserves.filter(reserve => reserve.closedAt === null),
		baseCurrency: book.baseCurrency,
		today
	}
}

/** Converts between two currencies through the base currency with the current rates. */
export function convertBetween(
	book: Book,
	minor: string,
	from: Currency,
	to: Currency
): string | null {
	if (from === to) {
		return minor
	}
	const base = toBase(book, minor, from)
	if (base === null) {
		return null
	}
	if (to === book.baseCurrency) {
		return base
	}
	const rate = book.rates.find(item => item.currency === to)
	if (!rate) {
		return null
	}
	// One unit of `to` costs `rate.value` base units, so divide.
	const inverse = (1 / Number(rate.value)).toFixed(8)
	return convert(base, inverse)
}

function input(minor: string | null): string | undefined {
	return minor === null ? undefined : formatInput(minor)
}

function clean(params: Record<string, string | null | undefined>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(params).filter(
			(entry): entry is [string, string] => typeof entry[1] === 'string'
		)
	)
}

/**
 * Opens the last saved record: with the changed fields to edit, or ready to delete. The
 * user still confirms on the form.
 */
function openLast(
	router: ReturnType<typeof useRouter>,
	book: Book,
	draft: CommandDraft,
	uncertain: readonly string[]
): string | null {
	const records = [...book.transactions, ...book.transfers]
	const last = records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
	if (!last) {
		return 'Nothing is recorded yet.'
	}
	const remove = draft.kind === 'delete_last' ? '1' : null
	const changed = { uncertain: uncertain.join(','), date: draft.date, note: draft.note, remove }
	if ('kind' in last) {
		router.push({
			pathname: '/expense',
			params: clean({ ...changed, id: last.id, amount: input(draft.amount) })
		})
	} else {
		router.push({
			pathname: '/transfer',
			params: clean({ ...changed, id: last.id, sent: input(draft.amount) })
		})
	}
	return null
}

/** Returns a message when the draft cannot open a form. */
export function openDraft(
	router: ReturnType<typeof useRouter>,
	book: Book,
	draft: CommandDraft
): string | null {
	const uncertain = [...draft.uncertain]
	const account = book.accounts.find(item => item.id === draft.accountId)
	let amount = draft.amount
	let note = draft.note
	// The form takes the amount in the Account currency. Convert, and keep the original in the note.
	if (amount && account && draft.currency && draft.currency !== account.currency) {
		const converted = convertBetween(book, amount, draft.currency, account.currency)
		note = [note, formatAmount(amount, draft.currency)].filter(Boolean).join(' · ')
		amount = converted
		uncertain.push('amount')
	}
	const common = { uncertain: uncertain.join(','), date: draft.date }
	switch (draft.kind) {
		case 'expense':
		case 'income':
			router.push({
				pathname: '/expense',
				params: clean({
					...common,
					kind: draft.kind,
					amount: input(amount),
					accountId: draft.accountId,
					reserveId: draft.kind === 'expense' ? draft.reserveId : null,
					note
				})
			})
			return null
		case 'transfer':
			router.push({
				pathname: '/transfer',
				params: clean({
					...common,
					fromAccountId: draft.accountId,
					toAccountId: draft.toAccountId,
					sent: input(amount),
					received: input(draft.received),
					note: draft.note
				})
			})
			return null
		case 'balance':
			if (!draft.accountId) {
				return 'Say which Account the balance is for.'
			}
			router.push({
				pathname: '/balance',
				params: clean({ ...common, accountId: draft.accountId, amount: input(draft.amount) })
			})
			return null
		case 'account':
			router.push({
				pathname: '/account',
				params: clean({
					name: draft.note,
					currency: draft.currency,
					amount: input(draft.amount),
					available: draft.available === false ? '0' : null
				})
			})
			return null
		case 'reserve':
			router.push({
				pathname: '/reserve',
				params: clean({
					name: draft.note,
					amount: input(draft.amount),
					currency: draft.currency,
					dueDate: draft.date
				})
			})
			return null
		case 'edit_last':
		case 'delete_last':
			return openLast(router, book, draft, uncertain)
		case 'rate':
			router.push({
				pathname: '/rate',
				params: clean({ currency: draft.currency, value: draft.rate })
			})
			return null
		case 'question':
		case 'update_rates':
			// The command bar answers these itself.
			return null
		default:
			return 'I did not find a command. Try: “27.50 at Żabka from Revolut”.'
	}
}
