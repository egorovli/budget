import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { today } from '../book/model.ts'
import { newId, useBook } from '../book/provider.tsx'
import { colors, errorText, Icon, styles as ui } from '../ui.tsx'
import { answer } from './answer.ts'
import { describeDraft } from './describe.ts'
import type { CommandKind } from './draft.ts'
import type { LogEntry } from './log.ts'
import { recordCommand } from './use-command-log.ts'
import { interpret } from './interpret.ts'
import { interpreterContext, openDraft } from './open-draft.ts'
import { useVoice } from './use-voice.ts'

const formNames: Partial<Record<CommandKind, string>> = {
	expense: 'expense',
	income: 'income',
	transfer: 'Transfer',
	balance: 'bank balance',
	account: 'new Account',
	reserve: 'Reserve',
	edit_last: 'last record',
	delete_last: 'last record (delete ready)',
	rate: 'rate'
}

interface Voiced {
	locale: string
	heard: string
}

function logEntry(text: string, voiced: Voiced | null): LogEntry {
	return {
		id: newId(),
		at: new Date().toISOString(),
		input: voiced ? 'voice' : 'typed',
		locale: voiced?.locale ?? null,
		text,
		heard: voiced && voiced.heard !== text ? voiced.heard : null,
		rules: null,
		model: null,
		raw: null,
		result: null,
		outcome: '',
		error: null,
		milliseconds: null
	}
}

const languages = [
	{ locale: 'en-US', label: 'EN', name: 'English' },
	{ locale: 'ru-RU', label: 'RU', name: 'Russian' },
	{ locale: 'pl-PL', label: 'PL', name: 'Polish' }
] as const

/**
 * Type or say a command. It opens a prefilled form; nothing is saved without Save.
 * `budget://?command=…` puts a command in the field, for example from an iOS Shortcut.
 */
export function CommandBar() {
	const router = useRouter()
	const { command } = useLocalSearchParams<{ command?: string }>()
	const { book, refreshRates } = useBook()
	const voice = useVoice()
	const [text, setText] = useState('')
	const [locale, setLocale] = useState<string>('en-US')
	const [busy, setBusy] = useState(false)
	const [message, setMessage] = useState<string | null>(null)
	const [reply, setReply] = useState<string | null>(null)
	useEffect(() => {
		if (command) {
			setText(command)
		}
	}, [command])

	/** Interprets a sentence, acts on it, and writes what happened to the command log. */
	const submit = async (sentence: string, voiced: Voiced | null = null) => {
		if (sentence.trim() === '' || busy) {
			return
		}
		setBusy(true)
		setMessage(null)
		setReply(null)
		const entry = logEntry(sentence, voiced)
		try {
			const result = await interpret(sentence, interpreterContext(book, today()))
			const { draft } = result
			Object.assign(entry, {
				rules: describeDraft(book, result.rules),
				model: result.model,
				raw: result.raw,
				result: describeDraft(book, draft),
				error: result.error,
				milliseconds: result.milliseconds
			})
			if (draft.kind === 'question') {
				entry.outcome = answer(book, draft)
				setReply(entry.outcome)
				return
			}
			if (draft.kind === 'update_rates') {
				await refreshRates()
				entry.outcome = 'Rates updated from NBP.'
				setReply(entry.outcome)
				setText('')
				return
			}
			const problem = openDraft(router, book, draft)
			entry.outcome = problem ?? `Opened the ${formNames[draft.kind] ?? draft.kind} form.`
			setMessage(problem)
			if (!problem) {
				setText('')
			}
		} catch (reason) {
			entry.error = errorText(reason)
			entry.outcome = 'Failed.'
			setMessage(entry.error)
		} finally {
			recordCommand(entry)
			setBusy(false)
		}
	}

	const listening = voice.phase === 'listening' || voice.phase === 'starting'
	const toggleVoice = async () => {
		if (listening) {
			const heard = await voice.stop()
			if (heard?.text) {
				setText(heard.text)
				await submit(heard.text, { locale, heard: heard.heard })
			} else if (heard) {
				// Nothing recognized: the log still shows what was heard live and why it failed.
				recordCommand({
					...logEntry('', { locale, heard: heard.heard }),
					outcome: 'Nothing recognized.',
					error: heard.error
				})
			}
			return
		}
		const hints = [...book.accounts.map(item => item.name), ...book.reserves.map(item => item.name)]
		await voice.start(locale, hints)
	}

	const language = languages.find(item => item.locale === locale) ?? languages[0]
	const nextLanguage = () => {
		const next = languages[(languages.indexOf(language) + 1) % languages.length] ?? languages[0]
		setLocale(next.locale)
	}

	return (
		<View style={styles.bar}>
			<View style={[styles.field, listening && styles.fieldListening]}>
				<TextInput
					accessibilityLabel='Command'
					value={listening ? voice.preview : text}
					onChangeText={setText}
					editable={!listening}
					placeholder={listening ? 'Listening…' : '27.50 at Żabka from Revolut'}
					placeholderTextColor={colors.secondary}
					style={[styles.input, listening && styles.preview]}
					returnKeyType='go'
					onSubmitEditing={() => void submit(text)}
					multiline={listening}
				/>
				{voice.available && !listening ? (
					<Pressable
						accessibilityRole='button'
						accessibilityLabel={`Voice language: ${language.name}. Tap to change.`}
						onPress={nextLanguage}
						hitSlop={8}
						style={({ pressed }) => [styles.language, pressed && ui.pressed]}
					>
						<Text style={styles.languageText}>{language.label}</Text>
					</Pressable>
				) : null}
				{voice.available ? (
					<Pressable
						accessibilityRole='button'
						accessibilityLabel={listening ? 'Stop and use what I said' : 'Speak a command'}
						onPress={() => void toggleVoice()}
						style={[
							styles.icon,
							listening && styles.iconActive,
							{ transform: [{ scale: 1 + voice.level * 0.2 }] }
						]}
					>
						<Icon
							name={listening ? 'stop.fill' : 'mic.fill'}
							fallback={listening ? '■' : '🎙'}
							size={listening ? 14 : 17}
							color={listening ? '#FFFFFF' : colors.action}
						/>
					</Pressable>
				) : null}
				{listening ? null : (
					<Pressable
						accessibilityRole='button'
						accessibilityLabel='Read the command'
						disabled={busy || text.trim() === ''}
						onPress={() => void submit(text)}
						style={[styles.icon, styles.go, (busy || text.trim() === '') && styles.goDisabled]}
					>
						{busy ? (
							<ActivityIndicator color='#FFFFFF' />
						) : (
							<Icon
								name='arrow.up'
								fallback='→'
								size={16}
								color='#FFFFFF'
							/>
						)}
					</Pressable>
				)}
			</View>
			{reply ? (
				<Pressable
					accessibilityRole='button'
					accessibilityLabel={`${reply} Tap to close.`}
					onPress={() => setReply(null)}
					style={styles.reply}
				>
					<Text style={[ui.body, styles.replyText]}>{reply}</Text>
				</Pressable>
			) : null}
			{message || voice.error ? (
				<Text
					style={[ui.warning, styles.message]}
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
	field: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		minHeight: 56,
		paddingLeft: 16,
		paddingRight: 6,
		paddingVertical: 6,
		backgroundColor: colors.surface,
		borderRadius: 28,
		borderCurve: 'continuous',
		borderWidth: 1,
		borderColor: colors.separator
	},
	fieldListening: { borderColor: colors.action, backgroundColor: colors.preview },
	input: { flex: 1, fontSize: 17, color: colors.ink, paddingVertical: 8 },
	preview: { color: colors.secondary },
	language: {
		height: 28,
		paddingHorizontal: 8,
		borderRadius: 14,
		justifyContent: 'center',
		backgroundColor: colors.group
	},
	languageText: { fontSize: 12, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5 },
	icon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center'
	},
	iconActive: { backgroundColor: colors.action },
	go: { backgroundColor: colors.action },
	goDisabled: { backgroundColor: colors.separator },
	message: { paddingHorizontal: 16 },
	reply: {
		backgroundColor: colors.preview,
		borderRadius: 16,
		borderCurve: 'continuous',
		paddingHorizontal: 16,
		paddingVertical: 12
	},
	replyText: { fontVariant: ['tabular-nums'] }
})
