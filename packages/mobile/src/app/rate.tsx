import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { setRates, today } from '~/book/model.ts'
import type { Currency } from '~/book/money.ts'
import { currencies, isCurrency, isRate } from '~/book/money.ts'
import { useBook } from '~/book/provider.tsx'
import { Button, Choice, ErrorText, errorText, Field, Screen, useClose } from '~/ui.tsx'

/** Sets one exchange rate by hand, for example from "курс евро 4.25". */
export default function RateScreen() {
	const close = useClose()
	const params = useLocalSearchParams<{ currency?: string; value?: string }>()
	const { book, update } = useBook()
	const others = currencies.filter(item => item !== book.baseCurrency)
	const [currency, setCurrency] = useState<Currency>(
		isCurrency(params.currency) && params.currency !== book.baseCurrency
			? params.currency
			: (others[0] ?? book.baseCurrency)
	)
	const current = book.rates.find(item => item.currency === currency)
	const [value, setValue] = useState(params.value ?? '')
	const [error, setError] = useState<string | null>(null)

	const save = () => {
		const normal = value.trim().replace(',', '.')
		if (!isRate(normal)) {
			setError('Enter a positive rate, for example 4.25.')
			return
		}
		update(stored =>
			setRates(stored, [{ currency, value: normal, date: today(), source: 'Manual' }])
		)
			.then(close)
			.catch((reason: unknown) => setError(errorText(reason)))
	}

	return (
		<Screen>
			<Choice
				label='Currency'
				value={currency}
				options={others.map(item => ({ value: item, label: item }))}
				onChange={setCurrency}
			/>
			<Field
				large={true}
				label={`${book.baseCurrency} for 1 ${currency}${current ? `, now ${current.value} (${current.source})` : ''}`}
				value={value}
				onChangeText={setValue}
				keyboardType='decimal-pad'
				placeholder={current?.value ?? '0.00'}
				autoFocus={!params.value}
				returnKeyType='done'
				onSubmitEditing={save}
			/>
			<ErrorText>{error}</ErrorText>
			<Button
				title='Save rate'
				onPress={save}
			/>
		</Screen>
	)
}
