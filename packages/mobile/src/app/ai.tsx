import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import type { AppleModelStatus, SpeechStatus } from '../../modules/budgetly-ai/index.ts'
import { downloadSize, formatBytes, needle } from '~/ai/catalog.ts'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects model-store.web.ts on web
import { download, isDownloaded, remove } from '~/ai/model-store'
// biome-ignore lint/correctness/useImportExtensions: platform seam, Metro selects needle.web.ts on web
import { forgetNeedle } from '~/ai/needle'
import type { Book } from '~/book/model.ts'
import { today } from '~/book/model.ts'
import { formatAmount } from '~/book/money.ts'
import { useBook } from '~/book/provider.tsx'
import type { CommandDraft } from '~/commands/draft.ts'
import type { Interpretation, ModelName } from '~/commands/interpret.ts'
import { interpret, native } from '~/commands/interpret.ts'
import { interpreterContext } from '~/commands/open-draft.ts'
import { interpretWithRules } from '~/commands/rules.ts'
import {
	Button,
	Choice,
	ConfirmButton,
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

/** One line per engine: what each one read from the sentence, to compare them. */
function summary(book: Book, draft: CommandDraft): string {
	const name = (id: string | null) =>
		[...book.accounts, ...book.reserves].find(item => item.id === id)?.name ?? null
	const parts = [
		draft.kind,
		draft.amount && draft.currency ? formatAmount(draft.amount, draft.currency) : draft.amount,
		name(draft.accountId),
		draft.toAccountId ? `→ ${name(draft.toAccountId)}` : null,
		draft.reserveId ? `from ${name(draft.reserveId)}` : null,
		draft.received && draft.toAccountId ? `received ${draft.received}` : null,
		draft.available === false ? 'not in Available money' : null,
		draft.question,
		draft.rate,
		draft.date,
		draft.note ? `“${draft.note}”` : null,
		draft.uncertain.length > 0 ? `check: ${draft.uncertain.join(', ')}` : null
	]
	return parts.filter(Boolean).join(' · ')
}

async function compare(sentence: string, book: Book): Promise<string> {
	const context = interpreterContext(book, today())
	const lines = [sentence]
	for (const engine of engines) {
		if (engine === 'rules') {
			lines.push(`  rules   ${summary(book, interpretWithRules(sentence, context))}`)
			continue
		}
		const result = await interpret(sentence, context, engine)
		const read = result.model ? summary(book, result.draft) : (result.error ?? 'not available')
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
		</Screen>
	)
}
