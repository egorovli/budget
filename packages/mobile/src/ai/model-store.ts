import { Directory, File, Paths } from 'expo-file-system'
import { BudgetAI } from '../../modules/budget-ai/index.ts'
import type { ModelEntry } from './catalog.ts'
import { filesFor } from './catalog.ts'

// Device storage for model files: Documents/models/<id>/<version>/, excluded from backups.
// Models are not user data; they can be downloaded again.

export interface Progress {
	received: number
	total: number
}

function directory(model: ModelEntry): Directory {
	return new Directory(Paths.document, 'models', model.id, model.version)
}

export function filePath(model: ModelEntry, name: string): string {
	return new File(directory(model), name).uri
}

export function isDownloaded(model: ModelEntry): Promise<boolean> {
	return Promise.resolve(
		filesFor(model, false).every(file => new File(directory(model), file.name).exists)
	)
}

export async function download(
	model: ModelEntry,
	onProgress: (progress: Progress) => void,
	signal: AbortSignal
): Promise<void> {
	const target = directory(model)
	target.create({ intermediates: true, idempotent: true })
	await BudgetAI.excludeFromBackup(target.uri)
	const files = filesFor(model, false)
	const total = files.reduce((sum, file) => sum + file.size, 0)
	let done = 0
	for (const file of files) {
		const destination = new File(target, file.name)
		if (destination.exists) {
			done += file.size
			continue
		}
		// Download to a temporary name, check the hash, then rename.
		const partial = new File(target, `${file.name}.partial`)
		if (partial.exists) {
			partial.delete()
		}
		const task = File.createDownloadTask(file.url, partial, {
			// iOS sends Int64 progress, which arrives as a BigInt despite the declared number type.
			onProgress: ({ bytesWritten }) => onProgress({ received: done + Number(bytesWritten), total })
		})
		const cancel = () => task.cancel()
		signal.addEventListener('abort', cancel)
		try {
			await task.downloadAsync()
		} finally {
			signal.removeEventListener('abort', cancel)
		}
		if (file.md5 && partial.info({ md5: true }).md5 !== file.md5) {
			partial.delete()
			throw new Error(`${file.name} does not match its checksum. Nothing was saved.`)
		}
		partial.move(destination)
		done += file.size
		onProgress({ received: done, total })
	}
}

export async function remove(model: ModelEntry): Promise<void> {
	await BudgetAI.needleUnload()
	const target = new Directory(Paths.document, 'models', model.id)
	if (target.exists) {
		target.delete()
	}
}
