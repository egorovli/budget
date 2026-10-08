export async function readJSON(): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input')
		input.hidden = true
		document.body.appendChild(input)
		input.type = 'file'
		input.accept = '.json,application/json'
		input.onchange = () => {
			const file = input.files?.[0]
			input.remove()
			if (!file) {
				reject(new Error('No file selected.'))
				return
			}
			void file
				.text()
				.then(text => resolve(JSON.parse(text)))
				.catch(reject)
		}
		input.oncancel = () => {
			input.remove()
			reject(new Error('File selection canceled.'))
		}
		input.click()
	})
}
export async function exportJSON(value: unknown) {
	const url = URL.createObjectURL(
		new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
	)
	const link = document.createElement('a')
	link.href = url
	link.download = 'budgetly-book.json'
	link.click()
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}
