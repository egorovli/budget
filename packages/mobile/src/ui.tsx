import { useRouter } from 'expo-router'
import type { SFSymbol } from 'expo-symbols'
import { SymbolView } from 'expo-symbols'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { TextInputProps } from 'react-native'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

// Clarity tokens, see docs/design.md.
export const colors = {
	surface: '#FFFFFF',
	group: '#F4F6FA',
	ink: '#101319',
	secondary: '#667182',
	tertiary: '#A3ABB8',
	action: '#245BFF',
	preview: '#EAF1FF',
	separator: '#E3E7EE',
	warning: '#9A3412'
}

/**
 * Every screen scrolls. On iOS the keyboard insets the content, so a focused field near the
 * bottom stays visible; a drag down hides the keyboard. Android resizes the window instead.
 */
export function Screen({ children }: { children: ReactNode }) {
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps='handled'
			keyboardDismissMode='interactive'
			automaticallyAdjustKeyboardInsets={true}
			contentInsetAdjustmentBehavior='automatic'
		>
			{children}
		</ScrollView>
	)
}

/** An SF Symbol on iOS; `fallback` text elsewhere. Icons are decorative: label the control. */
export function Icon({
	name,
	fallback,
	size = 17,
	color = colors.action
}: {
	name: SFSymbol
	fallback: string
	size?: number
	color?: string
}) {
	return (
		<SymbolView
			name={name}
			size={size}
			tintColor={color}
			weight='semibold'
			fallback={<Text style={{ fontSize: size, color }}>{fallback}</Text>}
		/>
	)
}

/** A white card. The negative margin hides the separator under the last row. */
export function Group({ children, tinted = false }: { children: ReactNode; tinted?: boolean }) {
	return (
		<View style={[styles.group, tinted && styles.tinted]}>
			<View style={styles.groupRows}>{children}</View>
		</View>
	)
}

export function Section({
	title,
	action,
	children
}: {
	title: string
	action?: { title: string; onPress: () => void }
	children: ReactNode
}) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<Text
					style={styles.sectionTitle}
					accessibilityRole='header'
				>
					{title}
				</Text>
				{action ? (
					<Pressable
						accessibilityRole='button'
						onPress={action.onPress}
						hitSlop={12}
						style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}
					>
						<Icon
							name='plus'
							fallback='+'
							size={14}
						/>
						<Text style={styles.sectionActionText}>{action.title}</Text>
					</Pressable>
				) : null}
			</View>
			<Group>{children}</Group>
		</View>
	)
}

interface RowProps {
	label: string
	value?: string
	detail?: string | null
	warning?: string | null
	onPress?: (() => void) | undefined
}

export function Row({ label, value, detail, warning, onPress }: RowProps) {
	const content = (
		<View style={styles.row}>
			<View style={styles.rowText}>
				<Text style={styles.body}>{label}</Text>
				{detail ? <Text style={styles.detail}>{detail}</Text> : null}
				{warning ? <Text style={styles.warning}>{warning}</Text> : null}
			</View>
			{value === undefined ? null : <Text style={[styles.body, styles.amount]}>{value}</Text>}
			{onPress ? (
				<Icon
					name='chevron.right'
					fallback='›'
					size={13}
					color={colors.tertiary}
				/>
			) : null}
		</View>
	)
	if (!onPress) {
		return content
	}
	return (
		<Pressable
			accessibilityRole='button'
			onPress={onPress}
			style={({ pressed }) => pressed && styles.pressed}
		>
			{content}
		</Pressable>
	)
}

export function Empty({ children }: { children: string }) {
	return <Text style={[styles.detail, styles.empty]}>{children}</Text>
}

export function Button({
	title,
	onPress,
	kind = 'primary',
	disabled = false
}: {
	title: string
	onPress: () => void
	/** `secondary` is a tinted button; `destructive` is for delete. */
	kind?: 'primary' | 'secondary' | 'destructive'
	disabled?: boolean
}) {
	return (
		<Pressable
			accessibilityRole='button'
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				styles[kind],
				(pressed || disabled) && styles.pressed
			]}
		>
			<Text style={styles[`${kind}Text`]}>{title}</Text>
		</Pressable>
	)
}

/** A destructive action that needs a second tap. `ready` starts at the second tap ("delete the last one"). */
export function ConfirmButton({
	title,
	confirmTitle,
	onConfirm,
	ready = false
}: {
	title: string
	confirmTitle: string
	onConfirm: () => void
	ready?: boolean
}) {
	const [armed, setArmed] = useState(ready)
	return (
		<Button
			kind='destructive'
			title={armed ? confirmTitle : title}
			onPress={() => {
				if (armed) {
					setArmed(false)
					onConfirm()
				} else {
					setArmed(true)
				}
			}}
		/>
	)
}

/** A label that asks the user to check a value that an interpreter guessed. */
function Label({ label, check }: { label: string; check: boolean }) {
	return (
		<Text style={styles.label}>
			{label}
			{check ? <Text style={styles.check}> · check this</Text> : null}
		</Text>
	)
}

export function Field({
	label,
	check = false,
	large = false,
	...props
}: TextInputProps & { label: string; check?: boolean; large?: boolean }) {
	return (
		<View style={styles.field}>
			<Label
				label={label}
				check={check}
			/>
			<TextInput
				accessibilityLabel={check ? `${label}, check this` : label}
				placeholderTextColor={colors.secondary}
				style={[styles.input, large && styles.inputLarge, check && styles.inputCheck]}
				{...props}
			/>
		</View>
	)
}

export function Choice<T extends string>({
	label,
	options,
	value,
	onChange,
	check = false
}: {
	label: string
	options: readonly { value: T; label: string }[]
	value: T
	onChange: (value: T) => void
	check?: boolean
}) {
	return (
		<View
			style={styles.field}
			accessibilityRole='radiogroup'
			accessibilityLabel={label}
		>
			<Label
				label={label}
				check={check}
			/>
			<View style={styles.choices}>
				{options.map(option => {
					const selected = option.value === value
					return (
						<Pressable
							key={option.value}
							accessibilityRole='radio'
							accessibilityState={{ selected }}
							onPress={() => onChange(option.value)}
							style={[styles.choice, selected && styles.choiceSelected]}
						>
							<Text style={selected ? styles.choiceSelectedText : styles.body}>
								{selected ? `✓ ${option.label}` : option.label}
							</Text>
						</Pressable>
					)
				})}
			</View>
		</View>
	)
}

export function ErrorText({ children }: { children: string | null }) {
	return children ? (
		<Text
			style={styles.warning}
			accessibilityLiveRegion='polite'
		>
			{children}
		</Text>
	) : null
}

export const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.group },
	content: {
		padding: 20,
		paddingBottom: 48,
		gap: 28,
		maxWidth: 640,
		width: '100%',
		alignSelf: 'center'
	},
	section: { gap: 10 },
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 4
	},
	sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.ink },
	sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
	sectionActionText: { fontSize: 15, fontWeight: '600', color: colors.action },
	group: {
		backgroundColor: colors.surface,
		borderRadius: 16,
		borderCurve: 'continuous',
		overflow: 'hidden'
	},
	groupRows: { marginBottom: -StyleSheet.hairlineWidth },
	row: {
		minHeight: 56,
		marginLeft: 16,
		paddingRight: 16,
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.separator
	},
	rowText: { flex: 1, gap: 2 },
	body: { fontSize: 17, color: colors.ink },
	amount: { fontVariant: ['tabular-nums'], textAlign: 'right', flexShrink: 0 },
	detail: { fontSize: 14, color: colors.secondary },
	warning: { fontSize: 14, color: colors.warning },
	empty: { padding: 16, textAlign: 'center' },
	pressed: { opacity: 0.6 },
	button: {
		minHeight: 50,
		borderRadius: 14,
		borderCurve: 'continuous',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 16
	},
	primary: { backgroundColor: colors.action },
	secondary: { backgroundColor: colors.preview },
	destructive: { backgroundColor: colors.surface },
	primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
	secondaryText: { color: colors.action, fontSize: 17, fontWeight: '600' },
	destructiveText: { color: colors.warning, fontSize: 17, fontWeight: '600' },
	field: { gap: 6 },
	label: { fontSize: 14, color: colors.secondary },
	check: { color: colors.warning, fontWeight: '600' },
	inputCheck: { borderWidth: 2, borderColor: colors.warning },
	input: {
		minHeight: 50,
		backgroundColor: colors.surface,
		borderRadius: 14,
		borderCurve: 'continuous',
		paddingHorizontal: 16,
		fontSize: 17,
		color: colors.ink
	},
	inputLarge: {
		minHeight: 72,
		fontSize: 34,
		fontWeight: '600',
		fontVariant: ['tabular-nums']
	},
	choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	choice: {
		minHeight: 40,
		paddingHorizontal: 14,
		borderRadius: 20,
		justifyContent: 'center',
		backgroundColor: colors.surface
	},
	choiceSelected: { backgroundColor: colors.action },
	choiceSelectedText: { fontSize: 17, color: '#FFFFFF', fontWeight: '600' },
	answer: {
		fontSize: 56,
		fontWeight: '700',
		letterSpacing: -1,
		color: colors.ink,
		fontVariant: ['tabular-nums']
	},
	answerLabel: { fontSize: 15, fontWeight: '500', color: colors.secondary },
	actions: { gap: 8 },
	tinted: { backgroundColor: colors.preview }
})

const causedBy = /\s*→ Caused by: /

/**
 * The message for the user. A native error arrives as "Calling the 'x' function has failed
 * → Caused by: …"; only the causes are useful.
 */
export function errorText(reason: unknown): string {
	if (!(reason instanceof Error)) {
		return 'Unexpected error.'
	}
	const causes = reason.message.split(causedBy).slice(1)
	return causes.length > 0 ? causes.join(': ') : reason.message
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Today", "Yesterday", "Oct 1", or "Oct 1, 2025" for another year. Dates are `YYYY-MM-DD`. */
export function formatDay(date: string, now: string): string {
	if (date === now) {
		return 'Today'
	}
	const [year, month, day] = date.split('-').map(Number)
	const [nowYear, nowMonth, nowDay] = now.split('-').map(Number)
	const days =
		(Date.UTC(nowYear ?? 0, (nowMonth ?? 1) - 1, nowDay) -
			Date.UTC(year ?? 0, (month ?? 1) - 1, day)) /
		86_400_000
	if (days === 1) {
		return 'Yesterday'
	}
	const text = `${months[(month ?? 1) - 1]} ${day}`
	return year === nowYear ? text : `${text}, ${year}`
}

/** Closes a form screen. A screen opened by a direct link has no history to go back to. */
export function useClose(): () => void {
	const router = useRouter()
	return () => {
		if (router.canGoBack()) {
			router.back()
		} else {
			router.replace('/')
		}
	}
}
