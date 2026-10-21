import { useState } from 'react'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects files.web.ts on web
import { exportJSON, readJSON } from '~/book/files'
import { useBook } from '~/book/provider.tsx'
import { Button, ConfirmButton, Empty, ErrorText, Row, Screen, Section, errorText } from '~/ui.tsx'

export default function SettingsScreen() {
	const { book, refreshRates, restore } = useBook()
	const [status, setStatus] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	const run = (task: () => Promise<string | null>) => {
		setBusy(true)
		setStatus(null)
		task()
			.then(setStatus)
			.catch((reason: unknown) => setStatus(errorText(reason)))
			.finally(() => setBusy(false))
	}

	return (
		<Screen>
			<Section title={`Current rates to ${book.baseCurrency}`}>
				{book.rates.length === 0 ? <Empty>No rates yet.</Empty> : null}
				{book.rates.map(rate => (
					<Row
						key={rate.currency}
						label={rate.currency}
						value={rate.value}
						detail={`${rate.source}, ${rate.date}`}
					/>
				))}
			</Section>
			<Button
				kind='secondary'
				title='Update rates from NBP'
				disabled={busy}
				onPress={() => run(() => refreshRates().then(() => 'Rates updated.'))}
			/>

			<Section title='Backup'>
				<Row
					label='Export the Book to a file'
					detail='Keep the file outside this device, for example in iCloud Drive.'
					onPress={() =>
						run(() =>
							exportJSON(`budgetly-${new Date().toISOString().slice(0, 10)}.json`, book).then(
								() => null
							)
						)
					}
				/>
			</Section>
			<ConfirmButton
				title='Restore from a file'
				confirmTitle='Tap again: this replaces all data'
				onConfirm={() =>
					run(() =>
						readJSON().then(file =>
							// biome-ignore lint/suspicious/noUnnecessaryConditions: Biome does not resolve the extensionless platform seam
							file === null ? null : restore(file.value).then(() => 'The Book is restored.')
						)
					)
				}
			/>
			<ErrorText>{status}</ErrorText>
		</Screen>
	)
}
