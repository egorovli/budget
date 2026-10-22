import { expect, test } from 'bun:test'
import type { LogEntry } from '../src/commands/log.ts'
import { appended, logLimit } from '../src/commands/log.ts'

function entry(id: number): LogEntry {
	return {
		id: String(id),
		at: new Date(Date.UTC(2026, 9, 22, 10, id)).toISOString(),
		input: 'typed',
		locale: null,
		text: `command ${id}`,
		heard: null,
		rules: null,
		model: null,
		raw: null,
		result: null,
		outcome: '',
		error: null,
		milliseconds: null
	}
}

test('the log keeps the newest entries first, up to the limit', () => {
	let entries: LogEntry[] = []
	for (let id = 0; id < logLimit + 5; id += 1) {
		entries = appended(entries, entry(id))
	}
	expect(entries).toHaveLength(logLimit)
	expect(entries[0]?.id).toBe(String(logLimit + 4))
	expect(entries.at(-1)?.id).toBe('5')
})
