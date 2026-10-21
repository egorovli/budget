import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { accountBalance, isDate, recordBalance, today } from '~/book/model.ts'
import { formatAmount, parseAmount } from '~/book/money.ts'
import { newId, useBook } from '~/book/provider.tsx'
import { Button, Empty, ErrorText, Field, Row, Screen, styles, errorText, useClose } from '~/ui.tsx'

export default function BalanceScreen() {
	const router = useRouter()
	const close = useClose()
	const { accountId } = useLocalSearchParams<{ accountId: string }>()
	const { book, update } = useBook()
	const account = book.accounts.find(item => item.id === accountId)
	const [amount, setAmount] = useState('')
	const [date, setDate] = useState(today())
	const [error, setError] = useState<string | null>(null)

	if (!account) {
		return (
			<Screen>
				<Empty>This Account does not exist.</Empty>
			</Screen>
		)
	}
	const calculated = accountBalance(book, account.id)
	const history = book.balances
		.filter(item => item.accountId === account.id)
		.toSorted((a, b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt))

	const save = () => {
		const minor = parseAmount(amount)
		if (minor === null) {
			setError('Enter the balance with at most two decimal places.')
			return
		}
		if (!isDate(date)) {
			setError('Enter the date as YYYY-MM-DD.')
			return
		}
		update(current =>
			recordBalance(current, {
				id: newId(),
				accountId: account.id,
				amount: minor,
				date,
				recordedAt: new Date().toISOString()
			})
		)
			.then(close)
			.catch((reason: unknown) => setError(errorText(reason)))
	}

	return (
		<Screen>
			<View style={styles.preview}>
				<Row
					label='Calculated balance'
					value={
						calculated.amount === null
							? 'Unknown'
							: formatAmount(calculated.amount, account.currency)
					}
					detail='The last bank balance minus the expenses recorded after it.'
				/>
			</View>
			<Field
				label={`${account.name}: balance in the bank app, ${account.currency}`}
				value={amount}
				onChangeText={setAmount}
				keyboardType='numbers-and-punctuation'
				autoFocus={true}
				placeholder='0.00'
				returnKeyType='done'
				onSubmitEditing={save}
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
				title='Save bank balance'
				onPress={save}
			/>
			<Button
				kind='secondary'
				title='Edit Account'
				onPress={() => router.replace({ pathname: '/account', params: { id: account.id } })}
			/>
			{history.length > 0 ? (
				<View style={styles.group}>
					{history.map(item => (
						<Row
							key={item.id}
							label={item.date}
							value={formatAmount(item.amount, account.currency)}
						/>
					))}
				</View>
			) : null}
		</Screen>
	)
}
