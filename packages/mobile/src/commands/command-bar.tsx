import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { today } from '../book/model.ts'
import { useBook } from '../book/provider.tsx'
import { colors, styles as ui } from '../ui.tsx'
import { interpret } from './interpret.ts'
import { interpreterContext, openDraft } from './open-draft.ts'
import { useVoice } from './use-voice.ts'

const languages = [
	{ locale: 'en-US', label: 'EN' },
	{ locale: 'ru-RU', label: 'RU' },
	{ locale: 'pl-PL', label: 'PL' }
] as const

/** Type or say a command. It opens a prefilled form; nothing is saved without Save. */
export function CommandBar() {
	const router = useRouter()
	const { book } = useBook()
	const voice = useVoice()
	const [text, setText] = useState('')
	const [locale, setLocale] = useState<string>('en-US')
	const [busy, setBusy] = useState(false)
	const [message, setMessage] = useState<string | null>(null)

	const submit = async (sentence: string) => {
		if (sentence.trim() === '' || busy) {
			return
		}
		setBusy(true)
		setMessage(null)
		try {
			const result = await interpret(sentence, interpreterContext(book, today()))
			const problem = openDraft(router, book, result.draft)
			setMessage(problem)
			if (!problem) {
				setText('')
			}
		} finally {
			setBusy(false)
		}
	}

	const listening = voice.phase === 'listening' || voice.phase === 'starting'
	const toggleVoice = async () => {
		if (listening) {
			const final = await voice.stop()
			if (final) {
				setText(final)
				await submit(final)
			}
			return
		}
		const hints = [...book.accounts.map(item => item.name), ...book.reserves.map(item => item.name)]
		await voice.start(locale, hints)
	}

	return (
		<View style={styles.bar}>
			<View style={styles.row}>
				<TextInput
					accessibilityLabel='Command'
					value={listening ? voice.preview : text}
					onChangeText={setText}
					editable={!listening}
					placeholder='27.50 at Żabka from Revolut'
					placeholderTextColor={colors.secondary}
					style={[styles.input, listening && styles.preview]}
					returnKeyType='go'
					onSubmitEditing={() => void submit(text)}
					multiline={listening}
				/>
				{voice.available ? (
					<Pressable
						accessibilityRole='button'
						accessibilityLabel={listening ? 'Stop and use what I said' : 'Speak a command'}
						onPress={() => void toggleVoice()}
						style={[
							styles.icon,
							listening && styles.iconActive,
							{ transform: [{ scale: 1 + voice.level * 0.25 }] }
						]}
					>
						<Text style={listening ? styles.iconActiveText : styles.iconText}>
							{listening ? '■' : '🎙'}
						</Text>
					</Pressable>
				) : null}
				<Pressable
					accessibilityRole='button'
					accessibilityLabel='Read the command'
					disabled={busy || listening}
					onPress={() => void submit(text)}
					style={[styles.icon, styles.go, (busy || listening) && ui.pressed]}
				>
					<Text style={styles.goText}>{busy ? '…' : '→'}</Text>
				</Pressable>
			</View>
			{voice.available ? (
				<View style={styles.languages}>
					{languages.map(item => (
						<Pressable
							key={item.locale}
							accessibilityRole='radio'
							accessibilityState={{ selected: locale === item.locale }}
							onPress={() => setLocale(item.locale)}
							style={[styles.language, locale === item.locale && styles.languageSelected]}
						>
							<Text style={locale === item.locale ? styles.languageSelectedText : ui.detail}>
								{item.label}
							</Text>
						</Pressable>
					))}
				</View>
			) : null}
			{message || voice.error ? (
				<Text
					style={ui.warning}
					accessibilityLiveRegion='polite'
				>
					{message ?? voice.error}
				</Text>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	bar: { gap: 8 },
	row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
	input: { ...StyleSheet.flatten(ui.input), flex: 1, paddingVertical: 12 },
	preview: { color: colors.secondary, fontStyle: 'italic' },
	icon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.surface,
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconText: { fontSize: 20 },
	iconActive: { backgroundColor: colors.warning },
	iconActiveText: { fontSize: 18, color: '#FFFFFF' },
	go: { backgroundColor: colors.action },
	goText: { fontSize: 22, color: '#FFFFFF', fontWeight: '600' },
	languages: { flexDirection: 'row', gap: 6 },
	language: {
		minHeight: 32,
		minWidth: 44,
		paddingHorizontal: 10,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.surface
	},
	languageSelected: { backgroundColor: colors.ink },
	languageSelectedText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' }
})
