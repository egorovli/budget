import type { Book } from '../book/model.ts'
import { formatAmount } from '../book/money.ts'
import type { CommandDraft } from './draft.ts'

/** One line with what an interpreter read from a sentence, to compare and debug. */
export function describeDraft(book: Book, draft: CommandDraft): string {
	const name = (id: string | null) =>
		[...book.accounts, ...book.reserves].find(item => item.id === id)?.name ?? null
	const parts = [
		draft.kind,
		draft.amount && draft.currency ? formatAmount(draft.amount, draft.currency) : draft.amount,
		name(draft.accountId),
		draft.toAccountId ? `→ ${name(draft.toAccountId)}` : null,
		draft.reserveId ? `from ${name(draft.reserveId)}` : null,
		draft.received && draft.toAccountId ? `received ${draft.received}` : null,
		draft.available === false ? 'not in Available money' : null,
		draft.question,
		draft.period ? `${draft.period.from}…${draft.period.to}` : null,
		draft.rate,
		draft.date,
		draft.note ? `“${draft.note}”` : null,
		draft.uncertain.length > 0 ? `check: ${draft.uncertain.join(', ')}` : null
	]
	return parts.filter(Boolean).join(' · ')
}
