import { needle } from './catalog.ts'
import { isDownloaded, readFile } from './model-store.web.ts'

// Needle in the browser: the WebAssembly engine runs in a Web Worker, so a request does not
// block the page. The engine has no network code; every file comes from Cache Storage.

const workerSource = `
let engine = null
let output = 0
const capacity = 16384
self.onmessage = async ({ data }) => {
	try {
		if (data.type === 'load') {
			const createNeedle = new Function(data.script + '; return createNeedle;')()
			engine = await createNeedle({ wasmBinary: new Uint8Array(data.wasm) })
			const weights = new Uint8Array(data.weights)
			const pointer = engine._malloc(weights.length)
			engine.HEAPU8.set(weights, pointer)
			const code = engine.ccall('needle_load', 'number', ['number', 'bigint'], [pointer, BigInt(weights.length)])
			engine._free(pointer)
			if (code < 0) throw new Error(engine.ccall('needle_last_error', 'string', [], []))
			output = engine._malloc(capacity)
			self.postMessage({ id: data.id, result: null })
			return
		}
		engine.ccall('needle_reset', null, [], [])
		const init = engine.ccall('needle_init', 'number', ['string', 'string', 'number'], [data.system, data.tools, 0])
		if (init < 0) throw new Error(engine.ccall('needle_last_error', 'string', [], []))
		const count = engine.ccall('needle_complete', 'number',
			['string', 'number', 'number', 'number', 'number', 'number'],
			[data.text, 0, 0, 256, output, capacity])
		if (count < 0) throw new Error(engine.ccall('needle_last_error', 'string', [], []))
		self.postMessage({ id: data.id, result: engine.UTF8ToString(output) })
	} catch (error) {
		self.postMessage({ id: data.id, error: String(error && error.message || error) })
	}
}
`

interface Reply {
	id: number
	result?: string | null
	error?: string
}

let worker: Worker | null = null
let ready: Promise<void> | null = null
let nextId = 0
const pending = new Map<
	number,
	{ resolve: (value: string | null) => void; reject: (error: Error) => void }
>()

function call(
	message: Record<string, unknown>,
	transfer: Transferable[] = []
): Promise<string | null> {
	const id = nextId++
	return new Promise((resolve, reject) => {
		pending.set(id, { resolve, reject })
		worker?.postMessage({ ...message, id }, transfer)
	})
}

function start(): Promise<void> {
	worker = new Worker(URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })))
	worker.onmessage = ({ data }: MessageEvent<Reply>) => {
		const handlers = pending.get(data.id)
		pending.delete(data.id)
		if (data.error) {
			handlers?.reject(new Error(data.error))
		} else {
			handlers?.resolve(data.result ?? null)
		}
	}
	return Promise.all([
		readFile(needle, 'needle.js'),
		readFile(needle, 'needle.wasm'),
		readFile(needle, 'needle3.cact')
	]).then(async ([script, wasm, weights]) => {
		await call({ type: 'load', script: new TextDecoder().decode(script), wasm, weights }, [
			wasm,
			weights
		])
	})
}

/** Runs Needle in the browser. Returns its raw JSON response, or null when it is not downloaded. */
export async function runNeedle(system: string, toolsJson: string, text: string) {
	if (!(await isDownloaded(needle))) {
		return null
	}
	ready ??= start().catch((error: unknown) => {
		forgetNeedle()
		throw error
	})
	await ready
	return call({ type: 'complete', system, tools: toolsJson, text })
}

export function forgetNeedle(): void {
	worker?.terminate()
	worker = null
	ready = null
}
