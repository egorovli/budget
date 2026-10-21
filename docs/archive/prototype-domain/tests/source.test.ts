import { expect, test } from 'bun:test'
import { sourceMatches, validateSource } from '../src/book/source.ts'
import { scaleSource } from './fixtures.ts'
test('2,000 independent synthetic source rows validate, filter and preserve values', () => {
	const source = scaleSource()
	expect(validateSource(source).entries).toHaveLength(2000)
	expect(sourceMatches(source, 'sample-0', '')).toHaveLength(1000)
	expect(sourceMatches(source, '', 'movement 1999')).toHaveLength(1)
	expect(validateSource(source)).toEqual(source)
	expect(() =>
		validateSource({ ...source, entries: [{ ...source.entries[0], accountId: 'missing' }] })
	).toThrow('Account')
	expect(() => validateSource({ ...source, schemaVersion: 2 })).toThrow('schemaVersion')
})

test('source metadata cannot persist a value that crashes preview rendering', () => {
	const source = scaleSource()
	expect(() =>
		validateSource({
			...source,
			accounts: [{ ...source.accounts[0], identityNote: { invalid: true } }, source.accounts[1]]
		})
	).toThrow('identityNote')
})

test('source references and reported net movement cannot be silently omitted or invalid', () => {
	const source = scaleSource()
	expect(() =>
		validateSource({
			...source,
			entries: source.entries.map((entry, index) => (index ? entry : { ...entry, sourceRow: 0 }))
		})
	).toThrow('sourceRow')
	expect(() =>
		validateSource({
			...source,
			checks: source.checks.map(check => ({ ...check, netMovement: undefined }))
		})
	).toThrow('netMovement')
})
