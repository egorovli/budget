export async function checkOfflineUpdate(): Promise<string> {
	if (!('serviceWorker' in navigator)) {
		return 'This browser cannot run the offline shell.'
	}
	const registration = await navigator.serviceWorker.getRegistration()
	if (!registration) {
		return 'Offline shell is available only in the exported preview. Development uses Fast Refresh.'
	}
	await registration.update()
	const installing = registration.installing
	if (installing) {
		await new Promise<void>((resolve, reject) => {
			installing.addEventListener('statechange', () => {
				if (installing.state === 'installed') {
					resolve()
				}
				if (installing.state === 'redundant') {
					reject(new Error('Shell update failed. The current cache is unchanged.'))
				}
			})
		})
	}
	return registration.waiting
		? 'An offline shell update is ready. Finish editing, then activate it.'
		: 'The offline shell is current.'
}
export async function activateOfflineUpdate(): Promise<void> {
	const registration = await navigator.serviceWorker.getRegistration()
	if (!registration?.waiting) {
		throw new Error('No downloaded shell update is waiting.')
	}
	navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
		once: true
	})
	registration.waiting.postMessage('activate')
}
