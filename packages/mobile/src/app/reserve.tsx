import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { isDate, reserveRemaining, saveReserve } from '~/book/model.ts'
import type { Currency } from '~/book/money.ts'
import { currencies, formatAmount, formatInput, isCurrency, parseAmount } from '~/book/money.ts'
import { newId, useBook } from '~/book/provider.tsx'
import {
	Button,
	Choice,
	ConfirmButton,
	ErrorText,
	errorText,
	Field,
	Group,
	Row,
	Screen,
	useClose
} from '~/ui.tsx'

export default function ReserveScreen() {
	const close = useClose()
	const { id, ...draft } = useLocalSearchParams<{
		id?: string
		name?: string
		amount?: string
		currency?: string
		dueDate?: string
	}>()
	const { book, update } = useBook()
	const existing = book.reserves.find(item => item.id === id)
	const [name, setName] = useState(existing?.name ?? draft.name ?? '')
	const [amount, setAmount] = useState(
		existing ? formatInput(existing.amount) : (draft.amount ?? '')
	)
	const [currency, setCurrency] = useState<Currency>(
		existing?.currency ?? (isCurrency(draft.currency) ? draft.currency : book.baseCurrency)
	)
	const [dueDate, setDueDate] = useState(existing?.dueDate ?? draft.dueDate ?? '')
	const [error, setError] = useState<string | null>(null)

	const save = (closedAt: string | null) => {
		const minor = parseAmount(amount)
		if (!name.trim()) {
			setError('Enter a name.')
			return
		}
		if (!minor || BigInt(minor) <= 0n) {
			setError('Enter a positive amount with at most two decimal places.')
			return
		}
		if (dueDate !== '' && !isDate(dueDate)) {
			setError('Enter the due date as YYYY-MM-DD, or leave it empty.')
			return
		}
		update(current =>
			saveReserve(current, {
				id: existing?.id ?? newId(),
				name: name.trim(),
				amount: minor,
				currency,
				dueDate: dueDate === '' ? null : dueDate,
				createdAt: existing?.createdAt ?? new Date().toISOString(),
				closedAt
			})
		)
			.then(close)
			.catch((reason: unknown) => setError(errorText(reason)))
	}

	return (
		<Screen>
			{existing ? (
				<Group tinted={true}>
					<Row
						label='Remaining'
						value={formatAmount(reserveRemaining(book, existing), existing.currency)}
						detail='The amount minus the expenses paid from this Reserve.'
					/>
				</Group>
			) : null}
			<Field
				label='Name'
				value={name}
				onChangeText={setName}
				autoFocus={!existing}
				placeholder='Rent'
			/>
			<Field
				large={true}
				label={`Amount, ${currency}`}
				value={amount}
				onChangeText={setAmount}
				keyboardType='decimal-pad'
				placeholder='0.00'
			/>
			<Choice
				label='Currency'
				value={currency}
				options={currencies.map(code => ({ value: code, label: code }))}
				onChange={setCurrency}
			/>
			<Field
				label='Due date (optional)'
				value={dueDate}
				onChangeText={setDueDate}
				placeholder='YYYY-MM-DD'
				autoCapitalize='none'
			/>
			<ErrorText>{error}</ErrorText>
			<Button
				title='Save'
				onPress={() => save(existing?.closedAt ?? null)}
			/>
			{existing && existing.closedAt === null ? (
				<ConfirmButton
					title='Close Reserve'
					confirmTitle='Tap again: the money is no longer set aside'
					onConfirm={() => save(new Date().toISOString())}
				/>
			) : null}
		</Screen>
	)
}
