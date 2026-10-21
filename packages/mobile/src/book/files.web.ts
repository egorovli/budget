/** Returns null when the user cancels. */
export function readJSON(): Promise<{ value: unknown } | null> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = '.json,application/json'
		input.onchange = () => {
			const file = input.files?.[0]
			if (!file) {
				resolve(null)
				return
			}
			file
				.text()
				.then(text => resolve({ value: JSON.parse(text) }))
				.catch(reject)
		}
		input.oncancel = () => {
			resolve(null)
		}
		input.click()
	})
}

export function exportJSON(name: string, value: unknown): Promise<void> {
	const url = URL.createObjectURL(
		new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
	)
	const link = document.createElement('a')
	link.href = url
	link.download = name
	link.click()
	setTimeout(() => URL.revokeObjectURL(url), 1000)
	return Promise.resolve()
}
