import type { ModelEntry } from './catalog.ts'
import { filesFor } from './catalog.ts'

// Browser storage for model files: Cache Storage, one cache per model version.

export interface Progress {
	received: number
	total: number
}

function cacheName(model: ModelEntry): string {
	return `budget-model-${model.id}-${model.version}`
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', bytes)
	return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function isDownloaded(model: ModelEntry): Promise<boolean> {
	const cache = await caches.open(cacheName(model))
	const found = await Promise.all(filesFor(model, true).map(file => cache.match(file.url)))
	return found.every(Boolean)
}

export async function download(
	model: ModelEntry,
	onProgress: (progress: Progress) => void,
	signal: AbortSignal
): Promise<void> {
	const files = filesFor(model, true)
	const total = files.reduce((sum, file) => sum + file.size, 0)
	let received = 0
	const cache = await caches.open(cacheName(model))
	for (const file of files) {
		if (await cache.match(file.url)) {
			received += file.size
			onProgress({ received, total })
			continue
		}
		const response = await fetch(file.url, { signal })
		if (!(response.ok && response.body)) {
			throw new Error(`Cannot download ${file.name} (${response.status}).`)
		}
		const reader = response.body.getReader()
		const chunks: Uint8Array[] = []
		for (;;) {
			const { done, value } = await reader.read()
			if (done) {
				break
			}
			chunks.push(value)
			received += value.length
			onProgress({ received, total })
		}
		const bytes = await new Blob(chunks as BlobPart[]).arrayBuffer()
		if ((await sha256(bytes)) !== file.sha256) {
			throw new Error(`${file.name} does not match its checksum. Nothing was saved.`)
		}
		await cache.put(file.url, new Response(bytes))
	}
}

export async function remove(model: ModelEntry): Promise<void> {
	await caches.delete(cacheName(model))
}

export async function readFile(model: ModelEntry, name: string): Promise<ArrayBuffer> {
	const file = model.files.find(item => item.name === name)
	const cache = await caches.open(cacheName(model))
	const response = file ? await cache.match(file.url) : undefined
	if (!response) {
		throw new Error(`${name} is not downloaded.`)
	}
	return response.arrayBuffer()
}
