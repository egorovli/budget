import '~/theme/index.ts'
import { useLocalSearchParams } from 'expo-router'
import { useBook } from '~/book/context.ts'
import { useEffect, useRef, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Stack } from 'expo-router/stack'
import type { SourceDataset, SourceEntry } from '~/book/source.ts'
import { sourceMatches } from '~/book/source.ts'
import { loadSource } from '~/book/storage'
import {
	ActionButton,
	Field,
	Note,
	Section,
	SelectField,
	StaticRow,
	PrototypeScreen
} from '~/components/prototype-ui.tsx'
export function SourcePreviewScreen() {
	const { book } = useBook()
	const params = useLocalSearchParams<{ 'book-id': string }>()
	const list = useRef<FlatList<SourceEntry>>(null)
	const [source, setSource] = useState<SourceDataset | null>(null)
	const [error, setError] = useState('')
	const [accountId, setAccountId] = useState('')
	const [search, setSearch] = useState('')
	const [selected, setSelected] = useState<SourceEntry | null>(null)
	useEffect(() => {
		void loadSource()
			.then((value: SourceDataset | null) => {
				if (value === null) {
					setError('No source data loaded. Choose a normalized JSON file in Prototype data.')
				} else {
					setSource(value)
				}
			})
			.catch(reason => setError(String(reason)))
	}, [])
	const entries = source ? sourceMatches(source, accountId, search) : []
	if (params['book-id'] !== book.id) {
		return <PrototypeScreen title='Book not found' />
	}
	return (
		<View style={styles.screen}>
			<Stack.Title>Read-only source preview</Stack.Title>
			<FlatList
				ref={list}
				data={entries}
				keyExtractor={item => item.id}
				initialNumToRender={15}
				ListHeaderComponent={
					<View style={styles.header}>
						<Text style={styles.title}>Read-only source preview</Text>
						<Note>
							Separate dataset. These source movements do not change the working Book. Unclassified
							movements stay unclassified. Linked exchanges keep their two original rows. Reported
							fees do not create additional debits.
						</Note>
						{error ? <Note>{error}</Note> : null}
						{source ? (
							<>
								<Note>
									{source.accounts.length} Account sections · {source.entries.length} source
									movements · {source.transfers.length} exchange links
								</Note>
								<Field
									label='Search source movements'
									value={search}
									onChangeText={setSearch}
								/>
								<SelectField
									label='Source Account filter'
									value={accountId}
									options={[
										{ value: '', label: 'All source Accounts' },
										...source.accounts.map(account => ({
											value: account.id,
											label: `${account.institution} · ${account.name} · ${account.currency}`
										}))
									]}
									onChange={value => {
										setAccountId(value)
										setSelected(null)
									}}
								/>
								<Section title='Statement coverage'>
									{source.accounts
										.filter(account => !accountId || account.id === accountId)
										.map(account => {
											const check = source.checks.find(item => item.accountId === account.id)
											return (
												<View key={account.id}>
													<StaticRow
														label={`${account.institution} · ${account.name}`}
														detail={`${account.periodStart} to ${account.periodEnd} · ${account.coverage}`}
														value={account.currency}
													/>
													{account.coverage.includes('balances absent') ||
													account.institution === 'TBank' ? (
														<StaticRow
															label='Net movement · not an Account balance'
															value={`${check?.netMovement ?? 'unknown'} ${account.currency}`}
														/>
													) : (
														<>
															<StaticRow
																label={`Statement opening · ${account.periodStart}`}
																value={`${account.openingBalance ?? 'unknown'} ${account.currency}`}
															/>
															<StaticRow
																label={`Reported closing · ${account.periodEnd}`}
																value={`${account.closingBalance ?? 'unknown'} ${account.currency}`}
															/>
														</>
													)}
													{account.coverage.includes('interest only') ? (
														<Note>
															Incomplete history. Zero movements do not prove a zero asset balance.
														</Note>
													) : null}
													{account.identityNote || account.name.includes('Kids') ? (
														<Note>
															{account.identityNote ||
																'Ownership is not established. This section is not assigned to the working Book.'}
														</Note>
													) : null}
													{check?.status === 'mismatch' ? (
														<Note>
															Statement discrepancy preserved. Calculated:{' '}
															{check.calculatedClosingBalance}; reported:{' '}
															{check.reportedClosingBalance}; difference: {check.difference}{' '}
															{account.currency}.
														</Note>
													) : null}
												</View>
											)
										})}
								</Section>
								<Section title='Checks and issues'>
									<Note>{JSON.stringify(source.checks, null, 2)}</Note>
									<Note>{JSON.stringify(source.issues, null, 2)}</Note>
								</Section>
								{selected ? (
									<Section title='Source movement details'>
										<ActionButton
											label='Close source detail'
											onPress={() => setSelected(null)}
										/>
										<Note>{JSON.stringify(selected, null, 2)}</Note>
										{selected.transferId ? (
											<>
												<Note>
													Exchange link:{' '}
													{JSON.stringify(
														source.transfers.find(item => item.id === selected.transferId)
													)}
												</Note>
												{source.entries
													.filter(item => item.transferId === selected.transferId)
													.map(item => (
														<StaticRow
															key={item.id}
															label={
																source.accounts.find(account => account.id === item.accountId)
																	?.name ?? item.accountId
															}
															value={`${item.amount} ${item.currency}`}
															detail={item.effectiveDate}
														/>
													))}
											</>
										) : null}
									</Section>
								) : null}
								<Text style={styles.detail}>{entries.length} matching movements</Text>
							</>
						) : null}
					</View>
				}
				renderItem={({ item }) => (
					<View style={styles.item}>
						<ActionButton
							label={`${item.effectiveDate} · ${item.amount} ${item.currency} · ${item.description}`}
							onPress={() => {
								setSelected(item)
								list.current?.scrollToOffset({ offset: 0 })
							}}
						/>
						<Text style={styles.detail}>
							{source?.accounts.find(account => account.id === item.accountId)?.name} ·{' '}
							{item.classification}
							{item.originalAmount
								? ` · Original ${item.originalAmount} ${item.originalCurrency}`
								: ''}
							{item.transferId ? ' · Linked exchange' : ''}
						</Text>
					</View>
				)}
				ListEmptyComponent={
					<Note>
						{source
							? 'No source movements match.'
							: 'Source preview is optional. The working Book works without it.'}
					</Note>
				}
			/>
		</View>
	)
}
const styles = StyleSheet.create(theme => ({
	screen: { flex: 1, backgroundColor: theme.colors.background },
	header: { padding: 16, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
	title: { fontSize: 28, fontWeight: '700', color: theme.colors.label },
	item: { padding: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
	detail: { color: theme.colors.secondaryLabel, paddingTop: 8 }
}))
