import type { SourceDataset } from '../src/book/source.ts'
export function scaleSource(): SourceDataset {
	const accounts = ['PLN', 'EUR'].map((currency, index) => ({
		id: `sample-${index}`,
		institution: 'Synthetic institution',
		name: `Synthetic ${currency}`,
		currency,
		openingBalance: '1000.00',
		closingBalance: '0.00',
		periodStart: '2026-10-01',
		periodEnd: '2026-10-08',
		coverage: 'synthetic scale data',
		sourceId: 'synthetic'
	}))
	const entries = Array.from({ length: 2000 }, (_, index) => ({
		id: `movement-${index}`,
		accountId: `sample-${index % 2}`,
		currency: index % 2 ? 'EUR' : 'PLN',
		effectiveDate: '2026-10-08',
		amount: index % 3 ? '-1.23' : '2.00',
		description: `Synthetic movement ${index}`,
		classification: 'unclassified',
		transferId: null,
		sourceId: 'synthetic',
		sourceRow: String(index + 1)
	}))
	return {
		schemaVersion: 1,
		accounts,
		entries,
		transfers: [],
		checks: accounts.map(account => ({
			accountId: account.id,
			entryCount: 1000,
			netMovement: '0.00',
			status: 'synthetic'
		})),
		issues: [],
		sources: [
			{
				id: 'synthetic',
				path: 'synthetic.csv',
				sha256: '0'.repeat(64),
				rawRows: entries.map(entry => [entry.description])
			}
		]
	} as SourceDataset
}
