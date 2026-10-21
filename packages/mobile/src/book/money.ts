export const currencies = ['PLN', 'EUR', 'USD', 'RUB', 'AMD'] as const
export type Currency = (typeof currencies)[number]

// Amounts are integer minor units, stored as strings. All supported currencies have two digits.
const minorDigits = 2
const minorScale = 10n ** BigInt(minorDigits)
const amountPattern = /^-?\d+(\.\d{1,2})?$/
const separatorPattern = /\s/g
const integerPattern = /^-?\d+$/
const ratePattern = /^\d+(\.\d+)?$/
const nonZeroPattern = /[1-9]/
const groupPattern = /\B(?=(\d{3})+(?!\d))/g

export function isCurrency(value: unknown): value is Currency {
	return currencies.some(currency => currency === value)
}

export function isMinor(value: unknown): value is string {
	return typeof value === 'string' && integerPattern.test(value)
}

export function isRate(value: unknown): value is string {
	return typeof value === 'string' && ratePattern.test(value) && nonZeroPattern.test(value)
}

/** Parses user input such as `1 234,5` into minor units. Returns null for invalid input. */
export function parseAmount(input: string): string | null {
	const value = input.replace(separatorPattern, '').replace(',', '.')
	if (!amountPattern.test(value)) {
		return null
	}
	const negative = value.startsWith('-')
	const [whole = '0', fraction = ''] = value.replace('-', '').split('.')
	const minor = BigInt(whole) * minorScale + BigInt(fraction.padEnd(minorDigits, '0'))
	return (negative ? -minor : minor).toString()
}

/** Formats minor units with grouped digits, a true minus sign and the currency code. */
export function formatAmount(minor: string, currency: Currency): string {
	const value = BigInt(minor)
	const absolute = value < 0n ? -value : value
	const whole = (absolute / minorScale).toString().replace(groupPattern, ' ')
	const fraction = (absolute % minorScale).toString().padStart(minorDigits, '0')
	return `${value < 0n ? '−' : ''}${whole}.${fraction} ${currency}`
}

/** Formats minor units for an input field, without grouping or currency. */
export function formatInput(minor: string): string {
	const value = BigInt(minor)
	const absolute = value < 0n ? -value : value
	const fraction = (absolute % minorScale).toString().padStart(minorDigits, '0')
	return `${value < 0n ? '-' : ''}${absolute / minorScale}.${fraction}`
}

/**
 * Converts minor units with a decimal rate (target units for one source unit).
 * Rounds half away from zero to the target minor unit.
 */
export function convert(minor: string, rate: string): string {
	const [whole = '0', fraction = ''] = rate.split('.')
	const rateScale = 10n ** BigInt(fraction.length)
	const product = BigInt(minor) * BigInt(whole + fraction)
	const sign = product < 0n ? -1n : 1n
	const absolute = product * sign
	return (sign * ((absolute * 2n + rateScale) / (rateScale * 2n))).toString()
}

export function sum(values: readonly string[]): string {
	return values.reduce((total, value) => total + BigInt(value), 0n).toString()
}
