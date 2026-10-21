import { useRouter } from 'expo-router'
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
	action: '#245BFF',
	preview: '#EAF1FF',
	separator: '#E3E7EE',
	warning: '#9A3412'
}

export function Screen({ children }: { children: ReactNode }) {
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.content}
			keyboardShouldPersistTaps='handled'
			contentInsetAdjustmentBehavior='automatic'
		>
			{children}
		</ScrollView>
	)
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<View style={styles.section}>
			<Text
				style={styles.sectionTitle}
				accessibilityRole='header'
			>
				{title}
			</Text>
			<View style={styles.group}>{children}</View>
		</View>
	)
}

interface RowProps {
	label: string
	value?: string
	detail?: string | null
	warning?: string | null
	onPress?: () => void
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
	kind?: 'primary' | 'secondary'
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
				kind === 'primary' ? styles.primary : styles.secondary,
				(pressed || disabled) && styles.pressed
			]}
		>
			<Text style={kind === 'primary' ? styles.primaryText : styles.secondaryText}>{title}</Text>
		</Pressable>
	)
}

/** A destructive action that needs a second tap. */
export function ConfirmButton({
	title,
	confirmTitle,
	onConfirm
}: {
	title: string
	confirmTitle: string
	onConfirm: () => void
}) {
	const [armed, setArmed] = useState(false)
	return (
		<Button
			kind='secondary'
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

export function Field({ label, ...props }: TextInputProps & { label: string }) {
	return (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>
			<TextInput
				accessibilityLabel={label}
				placeholderTextColor={colors.secondary}
				style={styles.input}
				{...props}
			/>
		</View>
	)
}

export function Choice<T extends string>({
	label,
	options,
	value,
	onChange
}: {
	label: string
	options: readonly { value: T; label: string }[]
	value: T
	onChange: (value: T) => void
}) {
	return (
		<View
			style={styles.field}
			accessibilityRole='radiogroup'
			accessibilityLabel={label}
		>
			<Text style={styles.label}>{label}</Text>
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
		gap: 24,
		maxWidth: 640,
		width: '100%',
		alignSelf: 'center'
	},
	section: { gap: 8 },
	sectionTitle: { fontSize: 20, fontWeight: '600', color: colors.ink },
	group: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		overflow: 'hidden'
	},
	row: {
		minHeight: 52,
		paddingHorizontal: 16,
		paddingVertical: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.separator
	},
	rowText: { flex: 1, gap: 2 },
	body: { fontSize: 17, color: colors.ink },
	amount: { fontVariant: ['tabular-nums'], textAlign: 'right', flexShrink: 0 },
	detail: { fontSize: 14, color: colors.secondary },
	warning: { fontSize: 14, color: colors.warning },
	empty: { padding: 16 },
	pressed: { opacity: 0.6 },
	button: {
		minHeight: 48,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 16
	},
	primary: { backgroundColor: colors.action },
	secondary: { backgroundColor: colors.surface },
	primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
	secondaryText: { color: colors.action, fontSize: 17, fontWeight: '600' },
	field: { gap: 6 },
	label: { fontSize: 14, color: colors.secondary },
	input: {
		minHeight: 48,
		backgroundColor: colors.surface,
		borderRadius: 12,
		paddingHorizontal: 16,
		fontSize: 17,
		color: colors.ink
	},
	choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
	choice: {
		minHeight: 44,
		paddingHorizontal: 14,
		borderRadius: 22,
		justifyContent: 'center',
		backgroundColor: colors.surface
	},
	choiceSelected: { backgroundColor: colors.action },
	choiceSelectedText: { fontSize: 17, color: '#FFFFFF', fontWeight: '600' },
	answer: { fontSize: 56, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
	answerLabel: { fontSize: 17, color: colors.secondary },
	preview: { backgroundColor: colors.preview, borderRadius: 14, padding: 16, gap: 4 }
})

export function errorText(reason: unknown): string {
	return reason instanceof Error ? reason.message : 'Unexpected error.'
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
