import { getDocumentAsync } from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import { shareAsync } from 'expo-sharing'

/** Returns null when the user cancels. */
export async function readJSON(): Promise<{ value: unknown } | null> {
	const result = await getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true })
	const asset = result.assets?.[0]
	if (result.canceled || !asset) {
		return null
	}
	return { value: JSON.parse(await new File(asset.uri).text()) }
}

export async function exportJSON(name: string, value: unknown): Promise<void> {
	const file = new File(Paths.cache, name)
	file.write(JSON.stringify(value, null, 2))
	await shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' })
}
