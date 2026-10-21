import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { isDate, removeRecord, saveExpense, saveIncome, today } from '~/book/model.ts'
import { formatInput, parseAmount } from '~/book/money.ts'
import { newId, useBook } from '~/book/provider.tsx'
import {
	Button,
	Choice,
	ConfirmButton,
	Empty,
	ErrorText,
	errorText,
	Field,
	Screen,
	useClose
} from '~/ui.tsx'

const none = 'none'

type Kind = 'expense' | 'income'

interface Params {
	id?: string
	// A draft from the command bar.
	kind?: Kind
	amount?: string
	accountId?: string
	reserveId?: string
	date?: string
	note?: string
	uncertain?: string
	[key: string]: string | undefined
}

export default function TransactionScreen() {
	const router = useRouter()
	const close = useClose()
	const params = useLocalSearchParams<Params>()
	const { book, update } = useBook()
	const existing = book.transactions.find(item => item.id === params.id)
	const check = new Set(params.uncertain?.split(',') ?? [])
	const latest = book.transactions.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
	const [kind, setKind] = useState<Kind>(existing?.kind ?? params.kind ?? 'expense')
	const [amount, setAmount] = useState(
		existing ? formatInput(existing.amount) : (params.amount ?? '')
	)
	const [accountId, setAccountId] = useState(
		existing?.accountId ?? params.accountId ?? latest?.accountId ?? book.accounts[0]?.id ?? ''
	)
	const [reserveId, setReserveId] = useState(
		(existing?.kind === 'expense' ? existing.reserveUse?.reserveId : params.reserveId) ?? none
	)
	const [note, setNote] = useState(existing?.note ?? params.note ?? '')
	const [date, setDate] = useState(existing?.date ?? params.date ?? today())
	const [error, setError] = useState<string | null>(null)

	const account = book.accounts.find(item => item.id === accountId)
	const previousReserve = existing?.kind === 'expense' ? existing.reserveUse?.reserveId : null
	// A Reserve-funded expense uses the same amount, so only Reserves in the Account currency fit.
	const reserves = book.reserves.filter(
		reserve =>
			reserve.currency === account?.currency &&
			(reserve.closedAt === null || reserve.id === previousReserve)
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
		const record = {
			id: existing?.id ?? newId(),
			accountId: account.id,
			amount: minor,
			date,
			note: note.trim(),
			createdAt: existing?.createdAt ?? new Date().toISOString()
		}
		const reserve = reserves.find(item => item.id === reserveId)
		update(current =>
			kind === 'income'
				? saveIncome(current, { ...record, kind })
				: saveExpense(current, {
						...record,
						kind,
						reserveUse: reserve ? { reserveId: reserve.id, amount: minor } : null
					})
		)
			.then(close)
			.catch((reason: unknown) => setError(errorText(reason)))
	}

	return (
		<Screen>
			<Choice
				label='Type'
				value={kind}
				options={[
					{ value: 'expense', label: 'Expense' },
					{ value: 'income', label: 'Income' }
				]}
				onChange={setKind}
			/>
			<Field
				label={`Amount${account ? `, ${account.currency}` : ''}`}
				check={check.has('amount')}
				value={amount}
				onChangeText={setAmount}
				keyboardType='decimal-pad'
				autoFocus={!(existing || params.amount)}
				placeholder='0.00'
				returnKeyType='done'
				onSubmitEditing={save}
			/>
			<Choice
				label='Account'
				check={check.has('accountId')}
				value={accountId}
				options={book.accounts.map(item => ({ value: item.id, label: item.name }))}
				onChange={value => {
					setAccountId(value)
					setReserveId(none)
				}}
			/>
			{kind === 'expense' && reserves.length > 0 ? (
				<Choice
					label='Pay from a Reserve'
					check={check.has('reserveId')}
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
				check={check.has('note')}
				value={note}
				onChangeText={setNote}
				placeholder={kind === 'income' ? 'Salary' : 'Groceries'}
			/>
			<Field
				label='Date'
				check={check.has('date')}
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
					title={`Delete ${existing.kind}`}
					confirmTitle='Tap again to delete'
					onConfirm={() => {
						update(current => removeRecord(current, existing.id))
							.then(close)
							.catch((reason: unknown) => setError(errorText(reason)))
					}}
				/>
			) : null}
		</Screen>
	)
}
