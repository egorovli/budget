import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { isDate, removeRecord, saveTransfer, today } from '~/book/model.ts'
import { formatInput, parseAmount } from '~/book/money.ts'
import { newId, useBook } from '~/book/provider.tsx'
import { convertBetween } from '~/commands/open-draft.ts'
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

interface Params {
	id?: string
	fromAccountId?: string
	toAccountId?: string
	sent?: string
	date?: string
	note?: string
	uncertain?: string
	[key: string]: string | undefined
}

export default function TransferScreen() {
	const close = useClose()
	const params = useLocalSearchParams<Params>()
	const { book, update } = useBook()
	const existing = book.transfers.find(item => item.id === params.id)
	const check = new Set(params.uncertain?.split(',') ?? [])
	const [fromId, setFromId] = useState(
		existing?.fromAccountId ?? params.fromAccountId ?? book.accounts[0]?.id ?? ''
	)
	const [toId, setToId] = useState(
		existing?.toAccountId ?? params.toAccountId ?? book.accounts[1]?.id ?? ''
	)
	const [sent, setSent] = useState(existing ? formatInput(existing.sent) : (params.sent ?? ''))
	const [received, setReceived] = useState(existing ? formatInput(existing.received) : '')
	const [note, setNote] = useState(existing?.note ?? params.note ?? '')
	const [date, setDate] = useState(existing?.date ?? params.date ?? today())
	const [error, setError] = useState<string | null>(null)

	const from = book.accounts.find(item => item.id === fromId)
	const to = book.accounts.find(item => item.id === toId)
	const exchange = from && to && from.currency !== to.currency
	const sentMinor = parseAmount(sent)
	// Suggest the received amount from the current rate; the bank's real amount wins.
	const suggested =
		exchange && sentMinor ? convertBetween(book, sentMinor, from.currency, to.currency) : null

	if (book.accounts.length < 2) {
		return (
			<Screen>
				<Empty>A Transfer needs two Accounts.</Empty>
			</Screen>
		)
	}

	const save = () => {
		const receivedMinor = exchange ? (parseAmount(received) ?? suggested) : sentMinor
		if (!(sentMinor && BigInt(sentMinor) > 0n && receivedMinor && BigInt(receivedMinor) > 0n)) {
			setError('Enter positive amounts with at most two decimal places.')
			return
		}
		if (!(from && to)) {
			setError('Select both Accounts.')
			return
		}
		if (!isDate(date)) {
			setError('Enter the date as YYYY-MM-DD.')
			return
		}
		update(current =>
			saveTransfer(current, {
				id: existing?.id ?? newId(),
				fromAccountId: from.id,
				toAccountId: to.id,
				sent: sentMinor,
				received: receivedMinor,
				date,
				note: note.trim(),
				createdAt: existing?.createdAt ?? new Date().toISOString()
			})
		)
			.then(close)
			.catch((reason: unknown) => setError(errorText(reason)))
	}

	const options = book.accounts.map(item => ({ value: item.id, label: item.name }))
	return (
		<Screen>
			<Choice
				label='From'
				check={check.has('accountId')}
				value={fromId}
				options={options}
				onChange={setFromId}
			/>
			<Choice
				label='To'
				check={check.has('toAccountId')}
				value={toId}
				options={options}
				onChange={setToId}
			/>
			<Field
				label={`Sent${from ? `, ${from.currency}` : ''}`}
				check={check.has('amount')}
				value={sent}
				onChangeText={setSent}
				keyboardType='decimal-pad'
				placeholder='0.00'
			/>
			{exchange ? (
				<Field
					label={`Received, ${to.currency}`}
					value={received}
					onChangeText={setReceived}
					keyboardType='decimal-pad'
					placeholder={suggested ? `${formatInput(suggested)} at the current rate` : '0.00'}
				/>
			) : null}
			<Field
				label='Note (optional)'
				value={note}
				onChangeText={setNote}
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
				title='Save transfer'
				onPress={save}
			/>
			{existing ? (
				<ConfirmButton
					title='Delete transfer'
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
