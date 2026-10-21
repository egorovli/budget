import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { accountBalance, freeAmount, reserveRemaining } from '~/book/model.ts'
import { formatAmount } from '~/book/money.ts'
import { useBook } from '~/book/provider.tsx'
import { CommandBar } from '~/commands/command-bar.tsx'
import { Button, Empty, Row, Screen, Section, styles } from '~/ui.tsx'

export default function Overview() {
	const router = useRouter()
	const { book } = useBook()
	const result = freeAmount(book)
	const base = book.baseCurrency
	const names = new Map(book.accounts.map(account => [account.id, account.name]))
	const incomplete = [
		...result.accountsWithoutBalance.map(id => `${names.get(id) ?? id} has no bank balance`),
		...result.currenciesWithoutRate.map(code => `no rate for ${code}`)
	]
	const openReserves = book.reserves.filter(reserve => reserve.closedAt === null)
	const recent = [...book.transactions, ...book.transfers]
		.toSorted((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
		.slice(0, 10)

	return (
		<Screen>
			<CommandBar />
			<View
				style={styles.section}
				accessible={true}
				accessibilityLabel={`Free amount ${formatAmount(result.free, base)}`}
			>
				<Text style={styles.answerLabel}>Free amount</Text>
				<Text
					style={styles.answer}
					adjustsFontSizeToFit={true}
					numberOfLines={1}
				>
					{formatAmount(result.free, base)}
				</Text>
			</View>
			<View style={styles.group}>
				<Row
					label='Available money'
					value={formatAmount(result.available, base)}
				/>
				<Row
					label='Reserves'
					value={formatAmount(`${-BigInt(result.reserved)}`, base)}
				/>
				<Row
					label='Free amount'
					value={formatAmount(result.free, base)}
					warning={incomplete.length > 0 ? `Incomplete: ${incomplete.join('; ')}.` : null}
				/>
			</View>

			<Section title='Accounts'>
				{book.accounts.length === 0 ? <Empty>Add the Accounts that you use to pay.</Empty> : null}
				{book.accounts.map(account => {
					const balance = accountBalance(book, account.id)
					const difference =
						balance.difference && balance.difference !== '0'
							? `Unrecorded difference ${formatAmount(balance.difference, account.currency)}`
							: null
					return (
						<Row
							key={account.id}
							label={account.name}
							value={
								balance.amount === null
									? 'No balance'
									: formatAmount(balance.amount, account.currency)
							}
							detail={[
								balance.latest ? `Bank balance of ${balance.latest.date}` : null,
								account.available ? null : 'Not in Available money'
							]
								.filter(Boolean)
								.join(' · ')}
							warning={difference}
							onPress={() =>
								router.push({ pathname: '/balance', params: { accountId: account.id } })
							}
						/>
					)
				})}
			</Section>
			<Button
				kind='secondary'
				title='Add an Account'
				onPress={() => router.push('/account')}
			/>

			<Section title='Reserves'>
				{openReserves.length === 0 ? (
					<Empty>Set money aside for rent, taxes or a trip.</Empty>
				) : null}
				{openReserves.map(reserve => (
					<Row
						key={reserve.id}
						label={reserve.name}
						value={formatAmount(reserveRemaining(book, reserve), reserve.currency)}
						detail={[
							reserve.dueDate ? `Due ${reserve.dueDate}` : null,
							`of ${formatAmount(reserve.amount, reserve.currency)}`
						]
							.filter(Boolean)
							.join(' · ')}
						onPress={() => router.push({ pathname: '/reserve', params: { id: reserve.id } })}
					/>
				))}
			</Section>
			<Button
				kind='secondary'
				title='Add a Reserve'
				onPress={() => router.push('/reserve')}
			/>

			<View style={styles.actions}>
				<Button
					title='Add an expense'
					onPress={() => router.push('/expense')}
				/>
				<Button
					kind='secondary'
					title='Transfer'
					onPress={() => router.push('/transfer')}
				/>
			</View>

			<Section title='Recent activity'>
				{recent.length === 0 ? <Empty>Nothing recorded yet.</Empty> : null}
				{recent.map(item => {
					if (!('kind' in item)) {
						const from = book.accounts.find(entry => entry.id === item.fromAccountId)
						const to = book.accounts.find(entry => entry.id === item.toAccountId)
						return (
							<Row
								key={item.id}
								label={`${from?.name ?? '?'} → ${to?.name ?? '?'}`}
								value={from ? formatAmount(item.sent, from.currency) : ''}
								detail={[item.date, 'Transfer', item.note].filter(Boolean).join(' · ')}
								onPress={() => router.push({ pathname: '/transfer', params: { id: item.id } })}
							/>
						)
					}
					const account = book.accounts.find(entry => entry.id === item.accountId)
					const reserve =
						item.kind === 'expense'
							? book.reserves.find(entry => entry.id === item.reserveUse?.reserveId)
							: undefined
					const sign = item.kind === 'expense' ? '-' : ''
					return (
						<Row
							key={item.id}
							label={item.note || account?.name || item.kind}
							value={account ? formatAmount(`${sign}${item.amount}`, account.currency) : ''}
							detail={[item.date, item.note ? account?.name : null, reserve?.name]
								.filter(Boolean)
								.join(' · ')}
							onPress={() => router.push({ pathname: '/expense', params: { id: item.id } })}
						/>
					)
				})}
			</Section>

			<Button
				kind='secondary'
				title='AI on this device'
				onPress={() => router.push('/ai')}
			/>
			<Button
				kind='secondary'
				title='Rates and data'
				onPress={() => router.push('/settings')}
			/>
		</Screen>
	)
}
