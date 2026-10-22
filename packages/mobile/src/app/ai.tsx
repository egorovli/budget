import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import type { AppleModelStatus, SpeechStatus } from '../../modules/budgetly-ai/index.ts'
import { downloadSize, formatBytes, needle } from '~/ai/catalog.ts'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects model-store.web.ts on web
import { download, isDownloaded, remove } from '~/ai/model-store'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects needle.web.ts on web
import { forgetNeedle } from '~/ai/needle'
import type { Book } from '~/book/model.ts'
import { today } from '~/book/model.ts'
import { useBook } from '~/book/provider.tsx'
import { describeDraft } from '~/commands/describe.ts'
import type { LogEntry } from '~/commands/log.ts'
import type { Interpretation, ModelName } from '~/commands/interpret.ts'
import { interpret, native } from '~/commands/interpret.ts'
import { interpreterContext } from '~/commands/open-draft.ts'
import { interpretWithRules } from '~/commands/rules.ts'
import { useCommandLog } from '~/commands/use-command-log.ts'
import {
	Button,
	Choice,
	ConfirmButton,
	colors,
	Empty,
	ErrorText,
	errorText,
	Field,
	Row,
	Screen,
	Section,
	styles
} from '~/ui.tsx'

const web = Platform.OS === 'web'
const speechLocales = ['en-US', 'ru-RU', 'pl-PL']

const speechText: Record<SpeechStatus['state'], string> = {
	ready: 'Ready on this iPhone',
	'needs-download': 'Download needed',
	unsupported: 'Not available on device',
	unavailable: 'Unavailable'
}

const appleReasons: Record<string, string> = {
	deviceNotEligible: 'This iPhone does not support Apple Intelligence.',
	appleIntelligenceNotEnabled: 'Turn on Apple Intelligence in Settings.',
	modelNotReady: 'Apple Intelligence is still downloading its model.',
	unsupportedOS: 'Needs iOS 26 or later.',
	unsupportedLanguage: 'Apple Intelligence does not support the language of this iPhone.'
}

function appleDetail(status: AppleModelStatus | null): string {
	if (web) {
		return 'Not available in the browser.'
	}
	if (status?.available) {
		return 'Reads English commands. Text never leaves this iPhone.'
	}
	return appleReasons[status?.reason ?? ''] ?? 'Checking…'
}

function needleValue(progress: number | null, downloaded: boolean | null): string {
	if (progress !== null) {
		return `${Math.round(progress * 100)}%`
	}
	return downloaded ? 'Downloaded' : formatBytes(downloadSize(needle, web))
}

function AppleSection() {
	const [status, setStatus] = useState<AppleModelStatus | null>(null)
	useEffect(() => {
		native
			?.getAppleModelStatus()
			.then(setStatus)
			.catch(() => setStatus({ available: false, reason: null }))
	}, [])
	return (
		<Section title='Apple Intelligence'>
			<Row
				label='On-device model'
				value={status?.available ? 'Ready' : 'Off'}
				detail={appleDetail(status)}
			/>
		</Section>
	)
}

function SpeechSection() {
	const [statuses, setStatuses] = useState<SpeechStatus[]>([])
	const [progress, setProgress] = useState<Record<string, number>>({})
	const [error, setError] = useState<string | null>(null)
	const refresh = useCallback(() => {
		native
			?.getSpeechStatus(speechLocales)
			.then(setStatuses)
			.catch((reason: unknown) => setError(errorText(reason)))
	}, [])
	useEffect(() => {
		refresh()
		const subscription = native?.addListener('onSpeechDownload', event =>
			setProgress(current => ({ ...current, [event.locale]: event.fraction }))
		)
		return () => subscription?.remove()
	}, [refresh])

	if (web) {
		return (
			<Section title='Voice'>
				<Row
					label='Speech recognition'
					value='Off'
					detail='Browser speech goes to a server, so voice works only in the iPhone app.'
				/>
			</Section>
		)
	}
	return (
		<Section title='Voice, recognized on this iPhone'>
			{statuses.map(status => {
				const fraction = progress[status.locale]
				return (
					<Row
						key={status.locale}
						label={status.locale}
						value={
							fraction !== undefined && fraction < 1
								? `${Math.round(fraction * 100)}%`
								: speechText[status.state]
						}
						detail={status.engine === 'dictation-transcriber' ? 'Dictation model' : null}
						onPress={
							status.state === 'needs-download'
								? () => {
										native
											?.downloadSpeech(status.locale)
											.then(refresh)
											.catch((reason: unknown) => setError(errorText(reason)))
									}
								: undefined
						}
					/>
				)
			})}
			<ErrorText>{error}</ErrorText>
		</Section>
	)
}

function NeedleSection() {
	const [downloaded, setDownloaded] = useState<boolean | null>(null)
	const [progress, setProgress] = useState<number | null>(null)
	const [error, setError] = useState<string | null>(null)
	const abort = useRef<AbortController | null>(null)
	const refresh = useCallback(() => {
		isDownloaded(needle)
			.then(setDownloaded)
			.catch(() => setDownloaded(false))
	}, [])
	useEffect(refresh, [refresh])

	const start = () => {
		abort.current = new AbortController()
		setError(null)
		setProgress(0)
		download(needle, ({ received, total }) => setProgress(received / total), abort.current.signal)
			.catch((reason: unknown) => setError(errorText(reason)))
			.finally(() => {
				setProgress(null)
				refresh()
			})
	}

	return (
		<Section title='Downloaded model'>
			<Row
				label={`${needle.name} · ${needle.publisher}`}
				value={needleValue(progress, downloaded)}
				detail={`${needle.description} ${needle.license}, version ${needle.version}. Runs on this device.`}
			/>
			<View style={[styles.row, { borderBottomWidth: 0 }]}>
				{progress === null ? null : (
					<Button
						kind='secondary'
						title='Cancel download'
						onPress={() => abort.current?.abort()}
					/>
				)}
				{progress === null && !downloaded ? (
					<Button
						title={`Download ${formatBytes(downloadSize(needle, web))}`}
						onPress={start}
					/>
				) : null}
				{progress === null && downloaded ? (
					<ConfirmButton
						title='Delete model'
						confirmTitle='Tap again to delete'
						onConfirm={() => {
							forgetNeedle()
							remove(needle)
								.catch((reason: unknown) => setError(errorText(reason)))
								.finally(refresh)
						}}
					/>
				) : null}
			</View>
			<ErrorText>{error}</ErrorText>
		</Section>
	)
}

type Engine = 'rules' | ModelName

const engines: readonly Engine[] = ['rules', 'apple', 'needle']
// A deep link loses line breaks, so `|` also separates commands.
const lineBreak = /\n|\|/
const mono = { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }

async function compare(sentence: string, book: Book): Promise<string> {
	const context = interpreterContext(book, today())
	const lines = [sentence]
	for (const engine of engines) {
		if (engine === 'rules') {
			lines.push(`  rules   ${describeDraft(book, interpretWithRules(sentence, context))}`)
			continue
		}
		const result = await interpret(sentence, context, engine)
		const read = result.model
			? describeDraft(book, result.draft)
			: (result.error ?? 'not available')
		lines.push(`  ${engine.padEnd(7)} ${read} · ${result.milliseconds} ms`)
	}
	return lines.join('\n')
}

/**
 * One line is one command. Several lines run through every engine and show the results side by
 * side. `budgetly://ai?text=…` fills the field and runs it.
 */
function TrySection() {
	const { book } = useBook()
	const params = useLocalSearchParams<{ text?: string }>()
	const [text, setText] = useState(
		params.text ?? 'add a payment of 27.50 zł at Żabka for groceries from Revolut'
	)
	const [result, setResult] = useState<Interpretation | null>(null)
	const [table, setTable] = useState<string | null>(null)
	const [model, setModel] = useState<ModelName | 'auto'>('auto')
	const [busy, setBusy] = useState(false)

	const run = useCallback(
		async (input: string) => {
			const sentences = input
				.split(lineBreak)
				.map(line => line.trim())
				.filter(line => line !== '')
			setBusy(true)
			setResult(null)
			setTable(null)
			try {
				if (sentences.length > 1) {
					const blocks: string[] = []
					for (const sentence of sentences) {
						const block = await compare(sentence, book)
						// Also in the Metro log, to read a long comparison on the computer.
						console.info(`[compare]\n${block}`)
						blocks.push(block)
						setTable(blocks.join('\n\n'))
					}
				} else {
					setResult(
						await interpret(
							input,
							interpreterContext(book, today()),
							model === 'auto' ? null : model
						)
					)
				}
			} finally {
				setBusy(false)
			}
		},
		[book, model]
	)

	const requested = params.text
	// biome-ignore lint/correctness/useExhaustiveDependencies: run once per link, not on every Book change
	useEffect(() => {
		if (requested) {
			setText(requested)
			void run(requested)
		}
	}, [requested])

	return (
		<Section title='Try a command'>
			<View style={[styles.content, { padding: 12, gap: 12 }]}>
				<Field
					label='Command (one per line or between | to compare engines)'
					value={text}
					onChangeText={setText}
					multiline={true}
				/>
				<Choice
					label='Model'
					value={model}
					options={[
						{ value: 'auto', label: 'Auto' },
						{ value: 'apple', label: 'Apple' },
						{ value: 'needle', label: 'Needle' }
					]}
					onChange={setModel}
				/>
				<Button
					title={busy ? 'Reading…' : 'Read'}
					disabled={busy}
					onPress={() => void run(text)}
				/>
				{table ? (
					<Text
						style={[styles.detail, mono]}
						selectable={true}
					>
						{table}
					</Text>
				) : null}
				{result ? (
					<Text
						style={[styles.detail, mono]}
						selectable={true}
					>
						{`${result.model ?? 'rules only'} · ${result.milliseconds} ms${result.error ? ` · ${result.error}` : ''}\n${JSON.stringify(result.draft, null, 2)}${result.raw ? `\n\n${result.raw}` : ''}`}
					</Text>
				) : null}
			</View>
		</Section>
	)
}

function time(iso: string): string {
	const date = new Date(iso)
	const pad = (value: number) => String(value).padStart(2, '0')
	return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function Line({ label, children }: { label: string; children: string | null }) {
	if (!children) {
		return null
	}
	return (
		<Text
			style={styles.detail}
			selectable={true}
		>
			<Text style={log.label}>{label} </Text>
			{children}
		</Text>
	)
}

/** One command: what was said, what each step read, and what the app did. Tap shows the raw model output. */
function LogItem({ entry }: { entry: LogEntry }) {
	const [open, setOpen] = useState(false)
	const meta = [
		time(entry.at),
		entry.input === 'voice' ? `voice ${entry.locale ?? ''}`.trim() : 'typed',
		entry.milliseconds === null ? null : `${entry.milliseconds} ms`
	]
	return (
		<Pressable
			accessibilityRole='button'
			accessibilityHint={open ? 'Hides the model output' : 'Shows the model output'}
			onPress={() => setOpen(!open)}
			style={log.item}
		>
			<Text style={styles.detail}>{meta.filter(Boolean).join(' · ')}</Text>
			<Text
				style={styles.body}
				selectable={true}
			>
				{entry.text === '' ? '(nothing recognized)' : `“${entry.text}”`}
			</Text>
			<Line label='Heard live:'>{entry.heard ? `“${entry.heard}”` : null}</Line>
			<Line label='Rules:'>{entry.rules}</Line>
			<Line label={`${entry.model === 'apple' ? 'Apple' : 'Needle'}, used:`}>
				{entry.model ? entry.result : null}
			</Line>
			<Line label='→'>{entry.outcome}</Line>
			{entry.error ? <ErrorText>{entry.error}</ErrorText> : null}
			{open && entry.raw ? (
				<Text
					style={[styles.detail, mono]}
					selectable={true}
				>
					{entry.raw}
				</Text>
			) : null}
		</Pressable>
	)
}

function LogSection() {
	const { entries, clear } = useCommandLog()
	return (
		<>
			<Section title='Command log'>
				{entries.length === 0 ? (
					<Empty>Commands from the main screen appear here. They stay on this iPhone.</Empty>
				) : null}
				{entries.map(entry => (
					<LogItem
						key={entry.id}
						entry={entry}
					/>
				))}
			</Section>
			{entries.length > 0 ? (
				<ConfirmButton
					title='Clear the log'
					confirmTitle='Tap again to clear'
					onConfirm={() => void clear()}
				/>
			) : null}
		</>
	)
}

const log = StyleSheet.create({
	item: {
		marginLeft: 16,
		paddingRight: 16,
		paddingVertical: 12,
		gap: 4,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.separator
	},
	label: { color: colors.ink, fontWeight: '600' }
})

export default function AIScreen() {
	return (
		<Screen>
			<Text style={styles.detail}>
				Commands are read on this device. Rules read every command; a model, when one is ready, adds
				what the rules missed. You always confirm before anything is saved.
			</Text>
			<AppleSection />
			<SpeechSection />
			<NeedleSection />
			<TrySection />
			<LogSection />
		</Screen>
	)
}
