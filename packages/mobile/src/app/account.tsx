import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { saveAccount } from '~/book/model.ts'
import type { Currency } from '~/book/money.ts'
import { currencies } from '~/book/money.ts'
import { newId, useBook } from '~/book/provider.tsx'
import { Button, Choice, ErrorText, Field, Screen, errorText, useClose } from '~/ui.tsx'

export default function AccountScreen() {
	const router = useRouter()
	const close = useClose()
	const { id } = useLocalSearchParams<{ id?: string }>()
	const { book, update } = useBook()
	const existing = book.accounts.find(item => item.id === id)
	const [name, setName] = useState(existing?.name ?? '')
	const [currency, setCurrency] = useState<Currency>(existing?.currency ?? book.baseCurrency)
	const [available, setAvailable] = useState(existing?.available ?? true)
	const [error, setError] = useState<string | null>(null)

	const save = () => {
		if (!name.trim()) {
			setError('Enter a name.')
			return
		}
		const accountId = existing?.id ?? newId()
		update(current =>
			saveAccount(current, {
				id: accountId,
				name: name.trim(),
				currency,
				available,
				createdAt: existing?.createdAt ?? new Date().toISOString()
			})
		)
			.then(() =>
				existing ? close() : router.replace({ pathname: '/balance', params: { accountId } })
			)
			.catch((reason: unknown) => setError(errorText(reason)))
	}

	return (
		<Screen>
			<Field
				label='Name'
				value={name}
				onChangeText={setName}
				autoFocus={!existing}
				placeholder='Main card'
			/>
			<Choice
				label='Currency'
				value={currency}
				options={currencies.map(code => ({ value: code, label: code }))}
				onChange={setCurrency}
			/>
			<Choice
				label='Available money'
				value={available ? 'yes' : 'no'}
				options={[
					{ value: 'yes', label: 'Include' },
					{ value: 'no', label: 'Do not include' }
				]}
				onChange={value => setAvailable(value === 'yes')}
			/>
			<ErrorText>{error}</ErrorText>
			<Button
				title={existing ? 'Save' : 'Next: bank balance'}
				onPress={save}
			/>
		</Screen>
	)
}
