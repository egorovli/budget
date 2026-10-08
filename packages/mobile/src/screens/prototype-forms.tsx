import { randomUUID } from 'expo-crypto'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
	ActionButton,
	ActionLink,
	Field,
	Note,
	PrototypeScreen,
	SelectField,
	useAction
} from '~/components/prototype-ui.tsx'
import { useBook } from '~/book/provider.tsx'
import type { Currency, Transaction, ExpenseLocation } from '~/book/model.ts'
import {
	currencies,
	categoryPath,
	saveTransfer,
	saveCategory,
	saveCounterparty,
	formatAmount,
	parseAmount,
	saveAccount,
	saveTransaction,
	today
} from '~/book/model.ts'
import {
	accountHref,
	accountsHref,
	activityHref,
	reserveHref,
	reservesHref,
	sampleReserveId,
	transactionHref
} from './prototype-routes.ts'
interface EntityFormScreenProps {
	bookId: string
	id?: string
}
function amountInput(amount: string, currency: Currency) {
	return formatAmount(amount, currency).split(' ')[0] ?? ''
}
export function TransactionFormScreen(props: EntityFormScreenProps) {
	const params = useLocalSearchParams<{ eventId?: string; accountId?: string }>()
	return (
		<TransactionForm
			key={props.id ?? params.eventId ?? params.accountId ?? 'new'}
			{...props}
		/>
	)
}
function TransactionForm({ bookId, id }: EntityFormScreenProps) {
	const { book, update, reload } = useBook()
	const params = useLocalSearchParams<{ accountId?: string; eventId?: string }>()
	const router = useRouter()
	const draft = book.pending?.find(item => item.eventId === params.eventId)
	const old = book.transactions.find(item => item.id === id)
	const [recordId] = useState(() => id ?? randomUUID())
	const [accountId, setAccountId] = useState(
		old?.accountId ??
			(params.eventId ? (draft?.accountId ?? '') : undefined) ??
			params.accountId ??
			book.transactions.at(-1)?.accountId ??
			book.accounts[0]?.id ??
			''
	)
	const account = book.accounts.find(item => item.id === accountId)
	const initialAmount = old?.amount ?? draft?.amount
	const [amount, setAmount] = useState(
		initialAmount ? amountInput(initialAmount, account?.currency ?? draft?.currency ?? 'PLN') : ''
	)
	const [type, setType] = useState<Transaction['type']>(old?.type ?? 'Expense')
	const [date, setDate] = useState(old?.date ?? draft?.date ?? today())
	const [categoryId, setCategoryId] = useState(old?.categoryId ?? '')
	const [counterpartyId, setCounterpartyId] = useState(old?.counterpartyId ?? '')
	const [note, setNote] = useState(old?.note ?? draft?.note ?? '')
	const initialOriginal = old?.original ?? draft?.original
	const [original, setOriginal] = useState(
		initialOriginal ? amountInput(initialOriginal.amount, initialOriginal.currency) : ''
	)
	const [originalCurrency, setOriginalCurrency] = useState<Currency>(
		old?.original?.currency ?? draft?.original?.currency ?? 'EUR'
	)
	const [rate, setRate] = useState(old?.rate?.value ?? '')
	const [rateFrom, setRateFrom] = useState<Currency>(
		old?.rate?.from ?? initialOriginal?.currency ?? 'EUR'
	)
	const [rateTo, setRateTo] = useState<Currency>(old?.rate?.to ?? account?.currency ?? 'PLN')
	const [location, setLocation] = useState<ExpenseLocation | null>(old?.location ?? null)
	const [reviewed, setReviewed] = useState(false)
	const action = useAction()
	const movedCurrency = Boolean(
		(old &&
			book.accounts.find(item => item.id === old.accountId)?.currency !== account?.currency) ||
			(draft && draft.currency !== account?.currency)
	)
	if (params.eventId && !draft) {
		return (
			<PrototypeScreen title='Capture already saved or dismissed'>
				<ActionLink
					href={activityHref(bookId)}
					label='Open Activity'
				/>
			</PrototypeScreen>
		)
	}
	if (id && !old) {
		return (
			<PrototypeScreen title='Transaction not found'>
				<ActionLink
					href={activityHref(bookId)}
					label='Open Activity'
				/>
			</PrototypeScreen>
		)
	}
	const save = async () => {
		if (!account) {
			throw new Error('Choose an Account.')
		}
		const transaction: Transaction = {
			id: recordId,
			bookId,
			accountId,
			type,
			amount: parseAmount(amount, account.currency),
			date,
			categoryId: categoryId || null,
			counterpartyId: counterpartyId || null,
			note
		}
		const eventId = old?.eventId ?? draft?.eventId
		if (eventId) {
			transaction.eventId = eventId
		}
		if (location && type === 'Expense') {
			transaction.location = location
		}
		if (old?.occurredAt) {
			transaction.occurredAt = old.occurredAt
		}
		if (original) {
			transaction.original = {
				amount: parseAmount(original, originalCurrency),
				currency: originalCurrency
			}
		}
		if (rate) {
			transaction.rate =
				old?.rate && old.rate.value === rate && old.rate.from === rateFrom && old.rate.to === rateTo
					? old.rate
					: {
							from: rateFrom,
							to: rateTo,
							value: rate,
							date,
							provenance: 'manual'
						}
		}
		await update(current => saveTransaction(current, transaction, reviewed))
		router.replace(transactionHref(bookId, recordId))
	}
	return (
		<PrototypeScreen
			title={id ? 'Edit transaction' : 'Record transaction'}
			description='Posted amount changes the selected Account. Other purchase details are optional.'
		>
			<Field
				label={`Posted amount · ${account?.currency ?? 'choose Account'}`}
				value={amount}
				onChangeText={setAmount}
				keyboardType='decimal-pad'
				placeholder='0.00'
			/>
			<SelectField
				label='Account'
				value={accountId}
				options={book.accounts.map(item => ({
					value: item.id,
					label: `${item.name} · ${item.currency}`
				}))}
				onChange={value => {
					setAccountId(value)
					setReviewed(false)
				}}
			/>
			<SelectField
				label='Type'
				value={type}
				options={['Expense', 'Income'].map(value => ({ value, label: value }))}
				onChange={value => {
					setType(value as Transaction['type'])
					if (value === 'Income') {
						setLocation(null)
					}
				}}
			/>
			<Field
				label='Transaction date · YYYY-MM-DD'
				value={date}
				onChangeText={setDate}
			/>
			<SelectField
				label='Category · optional'
				value={categoryId}
				options={[
					{ value: '', label: 'None' },
					...book.categories.map(item => ({ value: item.id, label: categoryPath(book, item.id) }))
				]}
				onChange={setCategoryId}
			/>
			<SelectField
				label='Counterparty · optional'
				value={counterpartyId}
				options={[
					{ value: '', label: 'None' },
					...book.counterparties.map(item => ({ value: item.id, label: item.name }))
				]}
				onChange={setCounterpartyId}
			/>
			<Field
				label='Note · optional'
				value={note}
				onChangeText={setNote}
				multiline
			/>
			<Field
				label='Original amount · optional'
				value={original}
				onChangeText={setOriginal}
				keyboardType='decimal-pad'
			/>
			<SelectField
				label='Original currency'
				value={originalCurrency}
				options={currencies.map(value => ({ value, label: value }))}
				onChange={value => setOriginalCurrency(value as Currency)}
			/>
			<Field
				label={`Recorded rate · optional · 1 ${rateFrom} = ? ${rateTo}`}
				value={rate}
				onChangeText={setRate}
				keyboardType='decimal-pad'
			/>
			{rate ? (
				<>
					<SelectField
						label='Rate from currency'
						value={rateFrom}
						options={currencies.map(value => ({ value, label: value }))}
						onChange={value => setRateFrom(value as Currency)}
					/>
					<SelectField
						label='Rate to currency'
						value={rateTo}
						options={currencies.map(value => ({ value, label: value }))}
						onChange={value => setRateTo(value as Currency)}
					/>
					<Note>
						Review this recorded pair. Account and Original currency edits do not change a
						historical rate automatically.
					</Note>
				</>
			) : null}
			{movedCurrency ? (
				<>
					<Note>
						Review the Posted amount in {account?.currency}. No conversion happens automatically.
					</Note>
					<ActionButton
						label={
							reviewed ? 'Posted amount reviewed' : 'Confirm Posted amount in destination currency'
						}
						onPress={() => setReviewed(true)}
					/>
				</>
			) : null}
			{type === 'Expense' ? (
				<>
					<Note>
						Location is optional. This action attaches a synthetic point, not your device location.
					</Note>
					<ActionButton
						label={location ? 'Remove Expense location' : 'Add simulated location'}
						onPress={() =>
							setLocation(location ? null : { latitude: 52.23, longitude: 21.01, simulated: true })
						}
					/>
					{location ? (
						<Note>
							{location.latitude}, {location.longitude} ·{' '}
							{location.simulated ? 'simulated' : 'recorded'}
						</Note>
					) : null}
				</>
			) : null}
			{action.error ? (
				<>
					<Note>{action.error}</Note>
					<ActionButton
						label='Reload saved data and keep input'
						onPress={() => action.run(reload)}
					/>
				</>
			) : null}
			<ActionButton
				label={action.busy ? 'Saving…' : 'Save transaction'}
				disabled={action.busy}
				onPress={() => action.run(save)}
			/>
			<ActionLink
				href={old ? transactionHref(bookId, old.id) : activityHref(bookId)}
				label='Cancel'
				secondary
			/>
		</PrototypeScreen>
	)
}
export function AccountFormScreen({ bookId, id }: EntityFormScreenProps) {
	const { book, update, reload } = useBook()
	const old = book.accounts.find(item => item.id === id)
	const router = useRouter()
	const [recordId] = useState(() => id ?? randomUUID())
	const [name, setName] = useState(old?.name ?? '')
	const [currency, setCurrency] = useState<Currency>(old?.currency ?? 'PLN')
	const [opening, setOpening] = useState(
		old?.opening === null ? '' : amountInput(old?.opening ?? '0', currency)
	)
	const [date, setDate] = useState(old?.openingDate ?? today())
	const [confirmed, setConfirmed] = useState(false)
	const action = useAction()
	if (id && !old) {
		return <PrototypeScreen title='Account not found' />
	}
	return (
		<PrototypeScreen title={id ? 'Edit Account' : 'Create Account'}>
			<Field
				label='Name'
				value={name}
				onChangeText={setName}
			/>
			<SelectField
				label='Currency'
				value={currency}
				options={currencies.map(value => ({ value, label: value }))}
				onChange={value => {
					setCurrency(value as Currency)
					setConfirmed(false)
				}}
			/>
			<Field
				label='Opening balance · blank means unknown'
				value={opening}
				onChangeText={value => {
					setOpening(value)
					setConfirmed(false)
				}}
				keyboardType='numbers-and-punctuation'
			/>
			<ActionButton
				label={opening ? 'Mark Opening balance unknown' : 'Opening balance is unknown'}
				disabled={!opening}
				onPress={() => {
					setOpening('')
					setConfirmed(false)
				}}
			/>
			<Field
				label='Opening date · YYYY-MM-DD'
				value={date}
				onChangeText={value => {
					setDate(value)
					setConfirmed(false)
				}}
			/>
			<Note>
				The Opening balance is the balance before activity starts on this date. Earlier activity is
				rejected.
			</Note>
			{old ? (
				<ActionButton
					label={confirmed ? 'Opening correction confirmed' : 'Confirm Opening balance correction'}
					onPress={() => setConfirmed(true)}
				/>
			) : null}
			{action.error ? (
				<>
					<Note>{action.error}</Note>
					<ActionButton
						label='Reload saved data and keep input'
						onPress={() => action.run(reload)}
					/>
				</>
			) : null}
			<ActionButton
				label='Save Account'
				disabled={action.busy}
				onPress={() =>
					action.run(async () => {
						await update(current =>
							saveAccount(
								current,
								{
									id: recordId,
									bookId,
									name,
									currency,
									opening: opening ? parseAmount(opening, currency) : null,
									openingDate: date
								},
								confirmed
							)
						)
						router.replace(accountHref(bookId, recordId))
					})
				}
			/>
			<ActionLink
				href={accountsHref(bookId)}
				label='Cancel'
				secondary
			/>
		</PrototypeScreen>
	)
}

export function TransferFormScreen(props: EntityFormScreenProps) {
	return (
		<TransferForm
			key={props.id ?? 'new'}
			{...props}
		/>
	)
}
function TransferForm({ bookId, id }: EntityFormScreenProps) {
	const { book, update, reload } = useBook()
	const router = useRouter()
	const old = (book.transfers ?? []).find(item => item.id === id)
	const [recordId] = useState(() => id ?? randomUUID())
	const [fromId, setFromId] = useState(old?.fromId ?? book.accounts[0]?.id ?? '')
	const [toId, setToId] = useState(old?.toId ?? book.accounts[1]?.id ?? '')
	const from = book.accounts.find(item => item.id === fromId)
	const to = book.accounts.find(item => item.id === toId)
	const [sent, setSent] = useState(old && from ? amountInput(old.sent, from.currency) : '')
	const [received, setReceived] = useState(old && to ? amountInput(old.received, to.currency) : '')
	const [date, setDate] = useState(old?.date ?? today())
	const [note, setNote] = useState(old?.note ?? '')
	const action = useAction()
	if (id && !old) {
		return <PrototypeScreen title='Transfer not found' />
	}
	const options = book.accounts.map(item => ({
		value: item.id,
		label: `${item.name} · ${item.currency}`
	}))
	return (
		<PrototypeScreen
			title={id ? 'Edit Transfer' : 'Transfer'}
			description='Both sides save together. A fee can be recorded as a separate Expense.'
		>
			<SelectField
				label='From Account'
				value={fromId}
				options={options}
				onChange={setFromId}
			/>
			<Field
				label={`Amount sent · ${from?.currency ?? ''}`}
				value={sent}
				onChangeText={setSent}
				keyboardType='decimal-pad'
			/>
			<SelectField
				label='To Account'
				value={toId}
				options={options}
				onChange={setToId}
			/>
			{from?.currency === to?.currency ? (
				<Note>Same currency: received amount equals sent amount.</Note>
			) : (
				<Field
					label={`Amount received · ${to?.currency ?? ''}`}
					value={received}
					onChangeText={setReceived}
					keyboardType='decimal-pad'
				/>
			)}
			<Field
				label='Transaction date · YYYY-MM-DD'
				value={date}
				onChangeText={setDate}
			/>
			<Field
				label='Note · optional'
				value={note}
				onChangeText={setNote}
			/>
			{action.error ? (
				<>
					<Note>{action.error}</Note>
					<ActionButton
						label='Reload saved data and keep input'
						onPress={() => action.run(reload)}
					/>
				</>
			) : null}
			<ActionButton
				label='Save Transfer'
				disabled={action.busy}
				onPress={() =>
					action.run(async () => {
						if (!from || !to) {
							throw new Error('Choose both Accounts.')
						}
						await update(current =>
							saveTransfer(current, {
								id: recordId,
								bookId,
								fromId,
								toId,
								sent: parseAmount(sent, from.currency),
								received: parseAmount(from.currency === to.currency ? sent : received, to.currency),
								date,
								note
							})
						)
						router.replace({
							pathname: '/books/[book-id]/transfers/[id]',
							params: { 'book-id': bookId, id: recordId }
						})
					})
				}
			/>
			<ActionLink
				href={activityHref(bookId)}
				label='Cancel'
				secondary
			/>
		</PrototypeScreen>
	)
}
export function CategoryFormScreen(props: EntityFormScreenProps) {
	return (
		<DirectoryForm
			key={props.id ?? 'new'}
			{...props}
			kind='Category'
		/>
	)
}
export function CounterpartyFormScreen(props: EntityFormScreenProps) {
	return (
		<DirectoryForm
			key={props.id ?? 'new'}
			{...props}
			kind='Counterparty'
		/>
	)
}
function DirectoryForm({
	bookId,
	id,
	kind
}: EntityFormScreenProps & { kind: 'Category' | 'Counterparty' }) {
	const { book, update, reload } = useBook()
	const router = useRouter()
	const old = (kind === 'Category' ? book.categories : book.counterparties).find(
		item => item.id === id
	)
	const [recordId] = useState(() => id ?? randomUUID())
	const [name, setName] = useState(old?.name ?? '')
	const [parentId, setParentId] = useState(
		book.categories.find(item => item.id === id)?.parentId ?? ''
	)
	const action = useAction()
	if (id && !old) {
		return <PrototypeScreen title={`${kind} not found`} />
	}
	const href = {
		pathname:
			kind === 'Category'
				? ('/books/[book-id]/categories' as const)
				: ('/books/[book-id]/counterparties' as const),
		params: { 'book-id': bookId }
	}
	return (
		<PrototypeScreen title={`${id ? 'Edit' : 'Create'} ${kind}`}>
			<Field
				label='Name'
				value={name}
				onChangeText={setName}
			/>
			{kind === 'Category' ? (
				<SelectField
					label='Parent · optional'
					value={parentId}
					options={[
						{ value: '', label: 'No parent' },
						...book.categories.map(item => ({ value: item.id, label: categoryPath(book, item.id) }))
					]}
					onChange={setParentId}
				/>
			) : (
				<Note>A matching name does not merge identities.</Note>
			)}
			{action.error ? (
				<>
					<Note>{action.error}</Note>
					<ActionButton
						label='Reload saved data and keep input'
						onPress={() => action.run(reload)}
					/>
				</>
			) : null}
			<ActionButton
				label={`Save ${kind}`}
				disabled={action.busy}
				onPress={() =>
					action.run(async () => {
						await update(current =>
							kind === 'Category'
								? saveCategory(current, { id: recordId, bookId, name, parentId: parentId || null })
								: saveCounterparty(current, { id: recordId, bookId, name })
						)
						router.replace(href)
					})
				}
			/>
			<ActionLink
				href={href}
				label='Cancel'
				secondary
			/>
		</PrototypeScreen>
	)
}
export function ReserveFormScreen({ bookId, id }: EntityFormScreenProps) {
	return (
		<PrototypeScreen
			description='A Reserve names a concrete commitment and can optionally allocate existing free money immediately.'
			title={id ? 'Edit Reserve' : 'Create Reserve'}
		>
			<Field
				defaultValue={id ? 'Tax' : undefined}
				label='Name'
				placeholder='What is the commitment?'
			/>
			<Field
				defaultValue={id ? '2,400 PLN' : undefined}
				label='Allocate now · optional'
				placeholder='0 PLN'
			/>
			<Field
				label='Note · optional'
				multiline
				placeholder='Why is this money set aside?'
			/>
			<ActionLink
				href={reserveHref(bookId, id ?? sampleReserveId)}
				label='Save Reserve'
			/>
			<ActionLink
				href={reservesHref(bookId)}
				label='Cancel'
				secondary
			/>
		</PrototypeScreen>
	)
}
