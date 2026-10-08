import { getDocumentAsync } from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import { shareAsync } from 'expo-sharing'
export async function readJSON(): Promise<unknown> {
	const result = await getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true })
	if (result.canceled || !result.assets[0]) {
		throw new Error('File selection canceled.')
	}
	return JSON.parse(await new File(result.assets[0].uri).text())
}
export async function exportJSON(value: unknown) {
	const file = new File(Paths.cache, 'budgetly-book.json')
	file.write(JSON.stringify(value, null, 2))
	await shareAsync(file.uri, { mimeType: 'application/json' })
}
