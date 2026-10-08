export async function checkOfflineUpdate(): Promise<string> {
	return 'Native uses the installed application and local SQLite. Web shell updates apply only to the exported browser preview.'
}
export async function activateOfflineUpdate(): Promise<void> {
	throw new Error('Web shell updates do not apply to native.')
}
