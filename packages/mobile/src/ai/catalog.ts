// Downloadable on-device models. Each file has a pinned URL and hashes, so the app loads only
// the exact bytes that were reviewed. The download carries no user data.

const needleRevision = 'd6c7d6a2e9655505e0f8e23339356dd1705900eb'
const needleBase = `https://huggingface.co/Cactus-Compute/needle3/resolve/${needleRevision}`

export interface ModelFile {
	name: string
	url: string
	size: number
	sha256: string
	md5: string | null
	/** Only the web build needs the WebAssembly engine; iOS links the engine into the app. */
	webOnly: boolean
}

export interface ModelEntry {
	id: string
	name: string
	publisher: string
	license: string
	description: string
	version: string
	files: ModelFile[]
}

export const needle: ModelEntry = {
	id: 'needle3',
	name: 'Needle 3',
	publisher: 'Cactus Compute',
	license: 'Apache-2.0',
	description:
		'A 121M-parameter model for tool calls. It reads English commands; it does not read Russian or Polish yet.',
	version: needleRevision.slice(0, 7),
	files: [
		{
			name: 'needle3.cact',
			url: `${needleBase}/needle3.cact`,
			size: 35_335_380,
			sha256: 'c9d915eca282ed42d1a09b143b592adb4cc6744ffe2d294adf5cfc5548170c38',
			md5: '71c31b0bb9dbbcbf64577a128a8d2e4a',
			webOnly: false
		},
		{
			name: 'needle.js',
			url: `${needleBase}/wasm/needle.js`,
			size: 62_082,
			sha256: 'a675c66f506a1b6f922d852c0cc0b82a843ce9d0fab6a80a408106f516df126f',
			md5: null,
			webOnly: true
		},
		{
			name: 'needle.wasm',
			url: `${needleBase}/wasm/needle.wasm`,
			size: 930_545,
			sha256: '7b73d09c17923bf81d6bdb82e19b3c343b8994f83d512ddec52eec9f6b029802',
			md5: null,
			webOnly: true
		}
	]
}

export function filesFor(model: ModelEntry, web: boolean): ModelFile[] {
	return model.files.filter(file => web || !file.webOnly)
}

export function downloadSize(model: ModelEntry, web: boolean): number {
	return filesFor(model, web).reduce((total, file) => total + file.size, 0)
}

export function formatBytes(bytes: number): string {
	return bytes >= 1_000_000
		? `${(bytes / 1_000_000).toFixed(1)} MB`
		: `${Math.ceil(bytes / 1000)} KB`
}
