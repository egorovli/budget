import type { Rate } from './model.ts'
import { isDate } from './model.ts'
import { isCurrency, isRate } from './money.ts'

// Current PLN rates from NBP. Table A is daily; table B is weekly and has AMD and RUB.
// See ADR 0004: callers ask for rates and do not select a provider.

interface NbpTable {
	table: string
	no: string
	effectiveDate: string
	rates: { code: string; mid: number }[]
}

async function table(name: 'A' | 'B'): Promise<NbpTable> {
	const response = await fetch(`https://api.nbp.pl/api/exchangerates/tables/${name}/?format=json`)
	if (!response.ok) {
		throw new Error(`NBP table ${name} is unavailable (${response.status}).`)
	}
	const [result] = (await response.json()) as NbpTable[]
	if (!(result && isDate(result.effectiveDate))) {
		throw new Error(`NBP table ${name} has an unexpected format.`)
	}
	return result
}

/** Fetches the current PLN rates of the supported currencies that NBP publishes. */
export async function fetchRates(): Promise<Rate[]> {
	const tables = await Promise.all([table('A'), table('B')])
	const rates: Rate[] = []
	for (const { no, effectiveDate, rates: entries } of tables) {
		for (const entry of entries) {
			const value = String(entry.mid)
			if (
				isCurrency(entry.code) &&
				entry.code !== 'PLN' &&
				isRate(value) &&
				!rates.some(rate => rate.currency === entry.code)
			) {
				rates.push({ currency: entry.code, value, date: effectiveDate, source: `NBP ${no}` })
			}
		}
	}
	return rates
}
