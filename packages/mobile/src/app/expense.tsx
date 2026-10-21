import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { isDate, removeExpense, saveExpense, today } from '~/book/model.ts'
import { formatInput, parseAmount } from '~/book/money.ts'
import { newId, useBook } from '~/book/provider.tsx'
import {
	Button,
	Choice,
	ConfirmButton,
	Empty,
	ErrorText,
	Field,
	Screen,
	errorText,
	useClose
} from '~/ui.tsx'

const none = 'none'

export default function ExpenseScreen() {
	const router = useRouter()
	const close = useClose()
	const { id } = useLocalSearchParams<{ id?: string }>()
	const { book, update } = useBook()
	const existing = book.transactions.find(item => item.id === id)
	const latest = book.transactions.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
	const [amount, setAmount] = useState(existing ? formatInput(existing.amount) : '')
	const [accountId, setAccountId] = useState(
		existing?.accountId ?? latest?.accountId ?? book.accounts[0]?.id ?? ''
	)
	const [reserveId, setReserveId] = useState(existing?.reserveUse?.reserveId ?? none)
	const [note, setNote] = useState(existing?.note ?? '')
	const [date, setDate] = useState(existing?.date ?? today())
	const [error, setError] = useState<string | null>(null)

	const account = book.accounts.find(item => item.id === accountId)
	// A Reserve-funded expense uses the same amount, so only Reserves in the Account currency fit.
	const reserves = book.reserves.filter(
		reserve =>
			reserve.currency === account?.currency &&
			(reserve.closedAt === null || reserve.id === existing?.reserveUse?.reserveId)
	)

	if (book.accounts.length === 0) {
		return (
			<Screen>
				<Empty>Add an Account first.</Empty>
				<Button
					title='Add an Account'
					onPress={() => router.replace('/account')}
				/>
			</Screen>
		)
	}

	const save = () => {
		const minor = parseAmount(amount)
		if (!minor || BigInt(minor) <= 0n) {
			setError('Enter a positive amount with at most two decimal places.')
			return
		}
		if (!account) {
			setError('Select an Account.')
			return
		}
		if (!isDate(date)) {
			setError('Enter the date as YYYY-MM-DD.')
			return
		}
		const reserve = reserves.find(item => item.id === reserveId)
		update(current =>
			saveExpense(current, {
				id: existing?.id ?? newId(),
				kind: 'expense',
				accountId: account.id,
				amount: minor,
				date,
				note: note.trim(),
				createdAt: existing?.createdAt ?? new Date().toISOString(),
				reserveUse: reserve ? { reserveId: reserve.id, amount: minor } : null
			})
		)
			.then(close)
			.catch((reason: unknown) => setError(errorText(reason)))
	}

	return (
		<Screen>
			<Field
				label={`Amount${account ? `, ${account.currency}` : ''}`}
				value={amount}
				onChangeText={setAmount}
				keyboardType='decimal-pad'
				autoFocus={!existing}
				placeholder='0.00'
				returnKeyType='done'
				onSubmitEditing={save}
			/>
			<Choice
				label='Account'
				value={accountId}
				options={book.accounts.map(item => ({ value: item.id, label: item.name }))}
				onChange={value => {
					setAccountId(value)
					setReserveId(none)
				}}
			/>
			{reserves.length > 0 ? (
				<Choice
					label='Pay from a Reserve'
					value={reserveId}
					options={[
						{ value: none, label: 'No Reserve' },
						...reserves.map(item => ({ value: item.id, label: item.name }))
					]}
					onChange={setReserveId}
				/>
			) : null}
			<Field
				label='Note (optional)'
				value={note}
				onChangeText={setNote}
				placeholder='Groceries'
			/>
			<Field
				label='Date'
				value={date}
				onChangeText={setDate}
				placeholder='YYYY-MM-DD'
				autoCapitalize='none'
			/>
			<ErrorText>{error}</ErrorText>
			<Button
				title='Save'
				onPress={save}
			/>
			{existing ? (
				<ConfirmButton
					title='Delete expense'
					confirmTitle='Tap again to delete'
					onConfirm={() => {
						update(current => removeExpense(current, existing.id))
							.then(close)
							.catch((reason: unknown) => setError(errorText(reason)))
					}}
				/>
			) : null}
		</Screen>
	)
}
