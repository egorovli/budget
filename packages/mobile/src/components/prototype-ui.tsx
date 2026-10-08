import { BookContext } from '~/book/context.ts'
import '~/theme/index.ts'

import type { Href } from 'expo-router'
import { Link, useLocalSearchParams } from 'expo-router'
import { Stack } from 'expo-router/stack'
import { useContext, useRef, useState } from 'react'
import type { PropsWithChildren, ReactNode } from 'react'
import type { TextInputProps } from 'react-native'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

interface PrototypeScreenProps extends PropsWithChildren {
	description?: string
	eyebrow?: string
	navigationTitle?: string
	title: string
}

interface ActionLinkProps {
	href: Href
	label: string
	secondary?: boolean
}

interface RowLinkProps {
	detail?: string
	href: Href
	label: string
	value?: string
}

interface FieldProps extends Omit<TextInputProps, 'style'> {
	defaultValue?: string | undefined
	label: string
	multiline?: boolean
	placeholder?: string
}

interface MetricProps {
	label: string
	note?: string
	value: string
}

interface SectionProps extends PropsWithChildren {
	action?: ReactNode
	title: string
}

export function PrototypeScreen({
	children,
	description,
	eyebrow = 'PROTOTYPE',
	navigationTitle,
	title
}: PrototypeScreenProps) {
	const params = useLocalSearchParams<{ 'book-id'?: string }>()
	const context = useContext(BookContext)
	if (params['book-id'] && context && params['book-id'] !== context.book.id) {
		return (
			<>
				<Stack.Title>Book not found</Stack.Title>
				<View style={styles.screenContent}>
					<Text style={styles.pageTitle}>Book not found</Text>
					<Link href='/books'>Select the working Book</Link>
				</View>
			</>
		)
	}

	return (
		<>
			<Stack.Title>{navigationTitle ?? title}</Stack.Title>
			<ScrollView
				contentContainerStyle={styles.screenContent}
				contentInsetAdjustmentBehavior='automatic'
				automaticallyAdjustKeyboardInsets
				keyboardShouldPersistTaps='handled'
				style={styles.screen}
			>
				<View style={styles.pageHeading}>
					<Text style={styles.eyebrow}>{eyebrow}</Text>
					<Text style={styles.pageTitle}>{title}</Text>
					{description ? <Text style={styles.pageDescription}>{description}</Text> : null}
				</View>
				{children}
			</ScrollView>
		</>
	)
}

export function ActionLink({ href, label, secondary = false }: ActionLinkProps) {
	return (
		<Link
			asChild
			href={href}
		>
			<Pressable style={secondary ? styles.secondaryButton : styles.button}>
				<Text style={styles.buttonLabel}>{label}</Text>
			</Pressable>
		</Link>
	)
}

export function InlineLink({ href, label }: Omit<ActionLinkProps, 'secondary'>) {
	return (
		<Link
			href={href}
			style={styles.inlineLink}
		>
			{label}
		</Link>
	)
}

export function RowLink({ detail, href, label, value }: RowLinkProps) {
	return (
		<Link
			asChild
			href={href}
		>
			<Pressable style={styles.row}>
				<View style={styles.rowCopy}>
					<Text style={styles.rowLabel}>{label}</Text>
					{detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
				</View>
				{value ? <Text style={styles.rowValue}>{value}</Text> : null}
				<Text style={styles.chevron}>›</Text>
			</Pressable>
		</Link>
	)
}

export function StaticRow({ detail, label, value }: Omit<RowLinkProps, 'href'>) {
	return (
		<View style={styles.row}>
			<View style={styles.rowCopy}>
				<Text style={styles.rowLabel}>{label}</Text>
				{detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
			</View>
			{value ? <Text style={styles.rowValue}>{value}</Text> : null}
		</View>
	)
}

export function Section({ action, children, title }: SectionProps) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionHeading}>
				<Text style={styles.sectionTitle}>{title}</Text>
				{action}
			</View>
			<View style={styles.sectionBody}>{children}</View>
		</View>
	)
}

export function Metric({ label, note, value }: MetricProps) {
	return (
		<View style={styles.metric}>
			<Text style={styles.metricLabel}>{label}</Text>
			<Text style={styles.metricValue}>{value}</Text>
			{note ? <Text style={styles.metricNote}>{note}</Text> : null}
		</View>
	)
}

export function MetricGrid({ children }: PropsWithChildren) {
	return <View style={styles.metricGrid}>{children}</View>
}

export function Field({
	defaultValue,
	label,
	multiline = false,
	placeholder,
	...inputProps
}: FieldProps) {
	return (
		<View style={styles.field}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<TextInput
				accessibilityLabel={label}
				{...inputProps}
				defaultValue={defaultValue}
				multiline={multiline}
				placeholder={placeholder}
				placeholderTextColor='#8e8e93'
				style={[styles.input, multiline && styles.multilineInput]}
			/>
		</View>
	)
}

export function ChoiceRow({ choices, label }: { choices: string[]; label: string }) {
	return (
		<View style={styles.field}>
			<Text style={styles.fieldLabel}>{label}</Text>
			<View style={styles.choiceRow}>
				{choices.map((choice, index) => (
					<View
						key={choice}
						style={[styles.choice, index === 0 && styles.activeChoice]}
					>
						<Text style={styles.choiceLabel}>{choice}</Text>
					</View>
				))}
			</View>
		</View>
	)
}

export function Note({ children }: PropsWithChildren) {
	return (
		<View style={styles.note}>
			<Text style={styles.noteText}>{children}</Text>
		</View>
	)
}

export function Bar({ label, value, width }: { label: string; value: string; width: number }) {
	return (
		<View style={styles.barRow}>
			<View style={styles.barCopy}>
				<Text style={styles.rowLabel}>{label}</Text>
				<Text style={styles.rowValue}>{value}</Text>
			</View>
			<View style={styles.barTrack}>
				<View style={[styles.barFill, { width: `${width}%` }]} />
			</View>
		</View>
	)
}

const styles = StyleSheet.create(theme => ({
	screen: {
		backgroundColor: theme.colors.background
	},
	screenContent: {
		width: '100%',
		maxWidth: 640,
		alignSelf: 'center',
		gap: theme.spacing(4),
		padding: theme.spacing(4),
		paddingBottom: theme.spacing(10)
	},
	pageHeading: {
		gap: theme.spacing(1),
		paddingBottom: theme.spacing(2)
	},
	eyebrow: {
		color: theme.colors.secondaryLabel,
		fontSize: 11,
		fontWeight: '600',
		letterSpacing: 0.8
	},
	pageTitle: {
		color: theme.colors.label,
		fontSize: 28,
		fontWeight: '700'
	},
	pageDescription: {
		color: theme.colors.secondaryLabel,
		fontSize: 15,
		lineHeight: 21
	},
	button: {
		alignItems: 'center',
		backgroundColor: theme.colors.accent,
		borderColor: theme.colors.accent,
		borderRadius: 8,
		borderWidth: 1,
		justifyContent: 'center',
		minHeight: 46,
		paddingHorizontal: theme.spacing(4),
		paddingVertical: theme.spacing(3)
	},
	secondaryButton: {
		alignItems: 'center',
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.separator,
		borderRadius: 8,
		borderWidth: 1,
		justifyContent: 'center',
		minHeight: 46,
		paddingHorizontal: theme.spacing(4),
		paddingVertical: theme.spacing(3)
	},
	buttonLabel: {
		color: theme.colors.label,
		fontSize: 16,
		fontWeight: '600'
	},
	inlineLink: {
		color: theme.colors.accent,
		fontSize: 14,
		fontWeight: '600'
	},
	row: {
		alignItems: 'center',
		borderBottomColor: theme.colors.separator,
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		gap: theme.spacing(2),
		minHeight: 56,
		paddingVertical: theme.spacing(2)
	},
	rowCopy: {
		minWidth: 0,
		flex: 1,
		gap: 2
	},
	rowLabel: {
		color: theme.colors.label,
		fontSize: 16,
		fontWeight: '500'
	},
	rowDetail: {
		color: theme.colors.secondaryLabel,
		fontSize: 13
	},
	rowValue: {
		flexShrink: 1,
		maxWidth: '45%',
		color: theme.colors.secondaryLabel,
		fontSize: 14,
		fontVariant: ['tabular-nums']
	},
	chevron: {
		color: theme.colors.secondaryLabel,
		fontSize: 24
	},
	section: {
		gap: theme.spacing(2)
	},
	sectionHeading: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	sectionTitle: {
		color: theme.colors.label,
		fontSize: 18,
		fontWeight: '700'
	},
	sectionBody: {
		borderTopColor: theme.colors.separator,
		borderTopWidth: StyleSheet.hairlineWidth
	},
	metric: {
		borderColor: theme.colors.separator,
		borderRadius: 8,
		borderWidth: 1,
		flexBasis: '47%',
		flexGrow: 1,
		gap: 3,
		minHeight: 96,
		padding: theme.spacing(3)
	},
	metricGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing(2)
	},
	metricLabel: {
		color: theme.colors.secondaryLabel,
		fontSize: 13
	},
	metricValue: {
		color: theme.colors.label,
		fontSize: 21,
		fontVariant: ['tabular-nums'],
		fontWeight: '700'
	},
	metricNote: {
		color: theme.colors.secondaryLabel,
		fontSize: 11
	},
	field: {
		gap: theme.spacing(2)
	},
	fieldLabel: {
		color: theme.colors.label,
		fontSize: 14,
		fontWeight: '600'
	},
	input: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.separator,
		borderRadius: 8,
		borderWidth: 1,
		color: theme.colors.label,
		fontSize: 16,
		minHeight: 44,
		paddingHorizontal: theme.spacing(3),
		paddingVertical: theme.spacing(2)
	},
	multilineInput: {
		minHeight: 88,
		textAlignVertical: 'top'
	},
	choiceRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing(2)
	},
	choice: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.separator,
		borderRadius: 8,
		borderWidth: 1,
		paddingHorizontal: theme.spacing(3),
		paddingVertical: theme.spacing(2)
	},
	activeChoice: {
		borderColor: theme.colors.accent,
		borderWidth: 2
	},
	choiceLabel: {
		color: theme.colors.label,
		fontSize: 14
	},
	note: {
		backgroundColor: theme.colors.surface,
		borderColor: theme.colors.separator,
		borderRadius: 8,
		borderWidth: 1,
		padding: theme.spacing(3)
	},
	noteText: {
		color: theme.colors.secondaryLabel,
		fontSize: 13,
		lineHeight: 19
	},
	barRow: {
		gap: theme.spacing(2),
		paddingVertical: theme.spacing(2)
	},
	barCopy: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	barTrack: {
		backgroundColor: theme.colors.surface,
		height: 8
	},
	barFill: {
		backgroundColor: theme.colors.secondaryLabel,
		height: 8
	}
}))

export function ActionButton({
	label,
	onPress,
	disabled = false
}: {
	label: string
	onPress: () => void
	disabled?: boolean
}) {
	return (
		<Pressable
			accessibilityRole='button'
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			style={[styles.secondaryButton, disabled && { opacity: 0.5 }]}
		>
			<Text style={styles.buttonLabel}>{label}</Text>
		</Pressable>
	)
}
export function SelectField({
	label,
	value,
	options,
	onChange
}: {
	label: string
	value: string
	options: { value: string; label: string }[]
	onChange: (value: string) => void
}) {
	const [search, setSearch] = useState('')
	const [open, setOpen] = useState(false)
	const selected = options.find(option => option.value === value)
	return (
		<View style={styles.field}>
			<ActionButton
				label={`${label}: ${selected?.label ?? 'Choose'}`}
				onPress={() => setOpen(!open)}
			/>
			{open ? (
				<>
					<Field
						label={`Search ${label}`}
						value={search}
						onChangeText={setSearch}
					/>
					<ScrollView
						style={{ maxHeight: 240 }}
						keyboardShouldPersistTaps='handled'
					>
						{options
							.filter(option => option.label.toLowerCase().includes(search.toLowerCase()))
							.map(option => (
								<ActionButton
									key={option.value}
									label={option.label}
									onPress={() => {
										onChange(option.value)
										setOpen(false)
										setSearch('')
									}}
								/>
							))}
					</ScrollView>
					{options.every(option => !option.label.toLowerCase().includes(search.toLowerCase())) ? (
						<Note>No matches.</Note>
					) : null}
				</>
			) : null}
		</View>
	)
}
export function ConfirmButton({
	label,
	explanation,
	onConfirm
}: {
	label: string
	explanation: string
	onConfirm: () => Promise<void>
}) {
	const [open, setOpen] = useState(false)
	const action = useAction()
	return (
		<>
			<ActionButton
				label={label}
				onPress={() => setOpen(true)}
			/>
			{open ? (
				<>
					<Note>{explanation}</Note>
					<ActionButton
						label={`Confirm ${label}`}
						disabled={action.busy}
						onPress={() =>
							action.run(async () => {
								await onConfirm()
								setOpen(false)
							})
						}
					/>
					<ActionButton
						label='Cancel confirmation'
						onPress={() => setOpen(false)}
					/>
				</>
			) : null}
			{action.error ? <Note>{action.error}</Note> : null}
		</>
	)
}
export function useAction() {
	const lock = useRef(false)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')
	return {
		busy,
		error,
		run: (action: () => Promise<void>) => {
			if (lock.current) {
				return
			}
			lock.current = true
			setBusy(true)
			setError('')
			void action()
				.catch(reason => setError(reason instanceof Error ? reason.message : String(reason)))
				.finally(() => {
					lock.current = false
					setBusy(false)
				})
		}
	}
}
