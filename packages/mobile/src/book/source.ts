import type { Currency } from './model.ts'
import { isCurrency, isDate, parseAmount, requireValue } from './model.ts'
export interface SourceAccount {
	id: string
	institution: string
	name: string
	currency: Currency
	openingBalance?: string | null
	closingBalance?: string | null
	periodStart: string
	periodEnd: string
	coverage: string
	sourceId: string
	identityNote?: string
}
export interface SourceEntry {
	id: string
	accountId: string
	currency: Currency
	effectiveDate: string
	amount: string
	description: string
	classification: 'unclassified' | 'internal-transfer'
	transferId: string | null
	sourceId: string
	sourceRow?: string | number
	sourcePage?: number
	sourceLine?: number
	originalAmount?: string
	originalCurrency?: Currency
	fee?: string
	counterparty?: string
	sourceText?: string
}
export interface SourceTransfer {
	id: string
	entryIds: [string, string]
	reference: string
	evidence: string
	sourceExchangeRate?: string
}
export interface SourceCheck {
	accountId: string
	entryCount: number
	netMovement: string
	status: string
	calculatedClosingBalance?: string
	reportedClosingBalance?: string
	difference?: string
	note?: string
}
export interface SourceDataset {
	schemaVersion: 1
	accounts: SourceAccount[]
	entries: SourceEntry[]
	transfers: SourceTransfer[]
	checks: SourceCheck[]
	issues: Record<string, unknown>[]
	sources: { id: string; path: string; sha256: string; rawRows?: string[][]; rawPages?: string[] }[]
}
const shaPattern = /^[a-fA-F0-9]{64}$/
const decimalPattern = /^\d+(\.\d+)?$/
function identifiers(items: unknown[], label: string) {
	const ids = new Set<string>()
	for (const record of items) {
		requireValue(record && typeof record === 'object', `${label}: invalid record.`)
		const item = record as { id: string }
		requireValue(
			typeof item.id === 'string' && item.id.trim() && !ids.has(item.id),
			`${label}: missing or duplicate ID.`
		)
		ids.add(item.id)
	}
	return ids
}
function sourceMoney(value: unknown, currency: Currency, label: string) {
	requireValue(typeof value === 'string', `${label}: amount must be a decimal string.`)
	parseAmount(value, currency)
}
export function validateSource(value: unknown): SourceDataset {
	requireValue(value && typeof value === 'object', 'Expected a normalized source document.')
	const data = value as SourceDataset
	requireValue(data.schemaVersion === 1, 'Unsupported normalized source schemaVersion. Expected 1.')
	for (const key of ['accounts', 'entries', 'transfers', 'checks', 'issues', 'sources'] as const) {
		requireValue(Array.isArray(data[key]), `Source ${key} must be a list.`)
	}
	const sources = identifiers(data.sources, 'Sources')
	const accounts = identifiers(data.accounts, 'Source Accounts')
	const entries = identifiers(data.entries, 'Source movements')
	const transfers = identifiers(data.transfers, 'Exchange links')
	for (const source of data.sources) {
		requireValue(
			typeof source.path === 'string' &&
				typeof source.sha256 === 'string' &&
				shaPattern.test(source.sha256),
			'Source: invalid path or SHA-256.'
		)
		requireValue(
			source.rawRows !== undefined || source.rawPages !== undefined,
			'Source: raw rows or pages are missing.'
		)
		if (source.rawRows !== undefined) {
			requireValue(
				Array.isArray(source.rawRows) &&
					source.rawRows.every(
						row => Array.isArray(row) && row.every(cell => typeof cell === 'string')
					),
				'Source: invalid rawRows.'
			)
		}
		if (source.rawPages !== undefined) {
			requireValue(
				Array.isArray(source.rawPages) && source.rawPages.every(page => typeof page === 'string'),
				'Source: invalid rawPages.'
			)
		}
	}
	for (const account of data.accounts) {
		requireValue(
			isCurrency(account.currency) &&
				typeof account.name === 'string' &&
				account.name.trim() &&
				typeof account.institution === 'string' &&
				typeof account.coverage === 'string' &&
				sources.has(account.sourceId),
			`Source Account ${account.id}: invalid name, currency, coverage or source.`
		)
		requireValue(
			isDate(account.periodStart) &&
				isDate(account.periodEnd) &&
				account.periodStart <= account.periodEnd,
			`Source Account ${account.id}: invalid statement period.`
		)
		requireValue(
			account.identityNote === undefined || typeof account.identityNote === 'string',
			`Source Account ${account.id}: identityNote must be text.`
		)
		for (const amount of [account.openingBalance, account.closingBalance]) {
			if (amount !== undefined && amount !== null) {
				sourceMoney(amount, account.currency, 'Statement balance')
			}
		}
	}
	for (const entry of data.entries) {
		const account = data.accounts.find(item => item.id === entry.accountId)
		requireValue(
			accounts.has(entry.accountId) &&
				sources.has(entry.sourceId) &&
				isCurrency(entry.currency) &&
				entry.currency === account?.currency &&
				isDate(entry.effectiveDate) &&
				typeof entry.description === 'string',
			`Movement ${entry.id}: invalid Account, source, currency, date or description.`
		)
		sourceMoney(entry.amount, entry.currency, `Movement ${entry.id}`)
		requireValue(
			entry.classification === 'unclassified' || entry.classification === 'internal-transfer',
			`Movement ${entry.id}: unsupported classification.`
		)
		requireValue(
			entry.classification === 'internal-transfer'
				? typeof entry.transferId === 'string' && transfers.has(entry.transferId)
				: entry.transferId === null,
			`Movement ${entry.id}: invalid exchange reference.`
		)
		const record = entry as unknown as Record<string, unknown>
		for (const key of ['operationDate', 'postingDate']) {
			const date = record[key]
			if (date !== undefined && date !== null && date !== '') {
				requireValue(isDate(date), `Movement ${entry.id}: invalid ${key}.`)
			}
		}
		if (entry.originalAmount !== undefined && entry.originalAmount !== '') {
			requireValue(
				isCurrency(entry.originalCurrency),
				`Movement ${entry.id}: Original currency is missing.`
			)
			sourceMoney(
				entry.originalAmount,
				entry.originalCurrency,
				`Movement ${entry.id} Original amount`
			)
		}
		if (record['reportedEquivalentCurrency']) {
			requireValue(
				isCurrency(record['reportedEquivalentCurrency']),
				`Movement ${entry.id}: invalid equivalent currency.`
			)
		}
		for (const key of ['balanceAfter', 'fee', 'taxWithheld', 'otherTaxes']) {
			const amount = record[key]
			if (amount !== undefined && amount !== null && amount !== '') {
				sourceMoney(amount, entry.currency, `Movement ${entry.id} ${key}`)
			}
		}
		for (const key of ['reportedEquivalentAmount', 'reportedEquivalentBalance']) {
			const amount = record[key]
			if (amount !== undefined && amount !== null && amount !== '') {
				requireValue(
					isCurrency(record['reportedEquivalentCurrency']),
					`Movement ${entry.id}: equivalent currency is missing.`
				)
				sourceMoney(amount, record['reportedEquivalentCurrency'], `Movement ${entry.id} ${key}`)
			}
		}
		if (record['sourceExchangeRate']) {
			requireValue(
				typeof record['sourceExchangeRate'] === 'string' &&
					decimalPattern.test(record['sourceExchangeRate']),
				`Movement ${entry.id}: invalid source rate.`
			)
		}
		const source = data.sources.find(item => item.id === entry.sourceId)
		if (entry.sourceRow !== undefined && entry.sourceRow !== '' && source?.rawRows) {
			requireValue(
				Number.isSafeInteger(Number(entry.sourceRow)) &&
					Number(entry.sourceRow) >= 1 &&
					Number(entry.sourceRow) <= (source?.rawRows?.length ?? 0),
				`Movement ${entry.id}: sourceRow is outside its source.`
			)
		}
		if (entry.sourcePage !== undefined) {
			requireValue(
				Number.isSafeInteger(entry.sourcePage) &&
					entry.sourcePage >= 1 &&
					entry.sourcePage <= (source?.rawPages?.length ?? 0),
				`Movement ${entry.id}: sourcePage is outside its source.`
			)
		}
		if (entry.sourceLine !== undefined) {
			requireValue(
				Number.isSafeInteger(entry.sourceLine) && entry.sourceLine >= 1,
				`Movement ${entry.id}: invalid sourceLine.`
			)
		}
	}
	const linked = new Set<string>()
	for (const transfer of data.transfers) {
		requireValue(
			Array.isArray(transfer.entryIds) &&
				transfer.entryIds.length === 2 &&
				transfer.entryIds[0] !== transfer.entryIds[1] &&
				transfer.entryIds.every(id => entries.has(id) && !linked.has(id)),
			`Exchange ${transfer.id}: expected two unique source movements.`
		)
		const pair = transfer.entryIds.map(id => {
			const entry = data.entries.find(item => item.id === id)
			requireValue(entry, `Exchange ${transfer.id}: movement not found.`)
			return entry
		})
		requireValue(
			pair.every(
				item => item.transferId === transfer.id && item.classification === 'internal-transfer'
			) && pair[0]?.accountId !== pair[1]?.accountId,
			`Exchange ${transfer.id}: inconsistent linked movements.`
		)
		for (const id of transfer.entryIds) {
			linked.add(id)
		}
	}
	requireValue(
		data.entries.every(
			entry => entry.classification !== 'internal-transfer' || linked.has(entry.id)
		),
		'A source exchange movement is not paired.'
	)
	for (const check of data.checks) {
		const account = data.accounts.find(item => item.id === check.accountId)
		requireValue(
			account &&
				Number.isSafeInteger(check.entryCount) &&
				check.entryCount ===
					data.entries.filter(entry => entry.accountId === check.accountId).length &&
				typeof check.status === 'string',
			'Source check: invalid Account or movement count.'
		)
		requireValue(
			typeof check.netMovement === 'string',
			'Source check: netMovement must be a decimal string.'
		)
		const record = check as unknown as Record<string, unknown>
		for (const key of [
			'credits',
			'debits',
			'netMovement',
			'calculatedClosingBalance',
			'reportedClosingBalance',
			'difference'
		]) {
			const amount = record[key]
			if (amount !== undefined && amount !== null) {
				sourceMoney(amount, account.currency, `Source check ${key}`)
			}
		}
	}
	for (const issue of data.issues) {
		requireValue(
			issue &&
				typeof issue === 'object' &&
				typeof issue['code'] === 'string' &&
				(!issue['accountId'] || accounts.has(String(issue['accountId']))) &&
				(!issue['entryId'] || entries.has(String(issue['entryId']))),
			'Source issue: invalid code or reference.'
		)
	}
	return data
}
export function sourceMatches(data: SourceDataset, accountId: string, text: string): SourceEntry[] {
	const query = text.toLowerCase()
	return data.entries.filter(
		entry =>
			(!accountId || entry.accountId === accountId) &&
			`${entry.description} ${entry.counterparty ?? ''} ${entry.amount} ${entry.currency} ${entry.effectiveDate}`
				.toLowerCase()
				.includes(query)
	)
}
