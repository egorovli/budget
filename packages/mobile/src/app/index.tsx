import { Stack, useRouter } from 'expo-router'
import type { SFSymbol } from 'expo-symbols'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { accountBalance, freeAmount, reserveRemaining, today } from '~/book/model.ts'
import { formatAmount } from '~/book/money.ts'
import { useBook } from '~/book/provider.tsx'
import { CommandBar } from '~/commands/command-bar.tsx'
import { Button, colors, Empty, formatDay, Icon, Row, Screen, Section, styles } from '~/ui.tsx'

export default function Overview() {
	const router = useRouter()
	const { book } = useBook()
	const result = freeAmount(book)
	const base = book.baseCurrency
	const now = today()
	const names = new Map(book.accounts.map(account => [account.id, account.name]))
	const incomplete = [
		...result.accountsWithoutBalance.map(id => `${names.get(id) ?? id} has no bank balance`),
		...result.currenciesWithoutRate.map(code => `no rate for ${code}`)
	]
	const openReserves = book.reserves.filter(reserve => reserve.closedAt === null)
	const recent = [...book.transactions, ...book.transfers]
		.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
		.slice(0, 10)

	return (
		<Screen>
			<Stack.Screen
				options={{
					headerRight: () => (
						<View style={local.headerButtons}>
							<HeaderButton
								icon='sparkles'
								fallback='AI'
								label='AI on this device'
								onPress={() => router.push('/ai')}
							/>
							<HeaderButton
								icon='gearshape'
								fallback='⚙'
								label='Rates and data'
								onPress={() => router.push('/settings')}
							/>
						</View>
					)
				}}
			/>
			<CommandBar />

			<View style={local.summary}>
				<View
					style={local.answer}
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
				<View style={local.basis}>
					<Basis
						label='Available money'
						value={formatAmount(result.available, base)}
					/>
					<Basis
						label='Reserves'
						value={formatAmount(`${-BigInt(result.reserved)}`, base)}
					/>
				</View>
				{incomplete.length > 0 ? (
					<Text style={[styles.warning, local.incomplete]}>
						{`Incomplete: ${incomplete.join('; ')}.`}
					</Text>
				) : null}
				<View style={local.actions}>
					<View style={local.action}>
						<Button
							title='Expense'
							onPress={() => router.push('/expense')}
						/>
					</View>
					<View style={local.action}>
						<Button
							kind='secondary'
							title='Transfer'
							onPress={() => router.push('/transfer')}
						/>
					</View>
				</View>
			</View>

			<Section
				title='Accounts'
				action={{ title: 'Add', onPress: () => router.push('/account') }}
			>
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
								balance.latest ? `Bank balance: ${formatDay(balance.latest.date, now)}` : null,
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

			<Section
				title='Reserves'
				action={{ title: 'Add', onPress: () => router.push('/reserve') }}
			>
				{openReserves.length === 0 ? (
					<Empty>Set money aside for rent, taxes or a trip.</Empty>
				) : null}
				{openReserves.map(reserve => (
					<Row
						key={reserve.id}
						label={reserve.name}
						value={formatAmount(reserveRemaining(book, reserve), reserve.currency)}
						detail={[
							reserve.dueDate ? `Due ${formatDay(reserve.dueDate, now)}` : null,
							`of ${formatAmount(reserve.amount, reserve.currency)}`
						]
							.filter(Boolean)
							.join(' · ')}
						onPress={() => router.push({ pathname: '/reserve', params: { id: reserve.id } })}
					/>
				))}
			</Section>

			<Section title='Recent activity'>
				{recent.length === 0 ? <Empty>Nothing recorded yet.</Empty> : null}
				{recent.map(item => {
					const day = formatDay(item.date, now)
					if (!('kind' in item)) {
						const from = book.accounts.find(entry => entry.id === item.fromAccountId)
						const to = book.accounts.find(entry => entry.id === item.toAccountId)
						return (
							<Row
								key={item.id}
								label={`${from?.name ?? '?'} → ${to?.name ?? '?'}`}
								value={from ? formatAmount(item.sent, from.currency) : ''}
								detail={[day, 'Transfer', item.note].filter(Boolean).join(' · ')}
								onPress={() => router.push({ pathname: '/transfer', params: { id: item.id } })}
							/>
						)
					}
					const account = book.accounts.find(entry => entry.id === item.accountId)
					const reserve =
						item.kind === 'expense'
							? book.reserves.find(entry => entry.id === item.reserveUse?.reserveId)
							: undefined
					const sign = item.kind === 'expense' ? '-' : '+'
					return (
						<Row
							key={item.id}
							label={item.note || account?.name || item.kind}
							value={account ? formatAmount(`${sign}${item.amount}`, account.currency) : ''}
							detail={[day, item.note ? account?.name : null, reserve?.name]
								.filter(Boolean)
								.join(' · ')}
							onPress={() => router.push({ pathname: '/expense', params: { id: item.id } })}
						/>
					)
				})}
			</Section>
		</Screen>
	)
}

function Basis({ label, value }: { label: string; value: string }) {
	return (
		<View style={local.basisRow}>
			<Text style={styles.detail}>{label}</Text>
			<Text style={[styles.detail, styles.amount, local.basisValue]}>{value}</Text>
		</View>
	)
}

function HeaderButton({
	icon,
	fallback,
	label,
	onPress
}: {
	icon: SFSymbol
	fallback: string
	label: string
	onPress: () => void
}) {
	return (
		<Pressable
			accessibilityRole='button'
			accessibilityLabel={label}
			onPress={onPress}
			hitSlop={8}
			style={({ pressed }) => [local.headerButton, pressed && styles.pressed]}
		>
			<Icon
				name={icon}
				fallback={fallback}
				size={19}
			/>
		</Pressable>
	)
}

const local = StyleSheet.create({
	headerButtons: { flexDirection: 'row', gap: 4 },
	headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
	summary: {
		backgroundColor: colors.surface,
		borderRadius: 20,
		borderCurve: 'continuous',
		padding: 20,
		gap: 16
	},
	answer: { gap: 2 },
	basis: {
		gap: 6,
		paddingTop: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.separator
	},
	basisRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
	basisValue: { color: colors.ink },
	incomplete: { marginTop: -4 },
	actions: { flexDirection: 'row', gap: 10 },
	action: { flex: 1 }
})
