import { expect, test } from 'bun:test'
import { convert, formatAmount, formatInput, parseAmount } from '../src/book/money.ts'

test('parses user input into exact minor units', () => {
	expect(parseAmount('12.34')).toBe('1234')
	expect(parseAmount('12,3')).toBe('1230')
	expect(parseAmount('1 234')).toBe('123400')
	expect(parseAmount('-0.05')).toBe('-5')
	expect(parseAmount('12.345')).toBeNull()
	expect(parseAmount('')).toBeNull()
	expect(parseAmount('1e3')).toBeNull()
})

test('formats minor units with grouping, a true minus sign and the currency', () => {
	expect(formatAmount('1240000', 'PLN')).toBe('12 400.00 PLN')
	expect(formatAmount('-5', 'EUR')).toBe('−0.05 EUR')
	expect(formatInput('-123405')).toBe('-1234.05')
})

test('converts with a decimal rate and rounds half away from zero', () => {
	expect(convert('10000', '4.2715')).toBe('42715')
	expect(convert('1', '0.5')).toBe('1')
	expect(convert('-1', '0.5')).toBe('-1')
	expect(convert('1', '0.4999')).toBe('0')
	expect(convert('100000', '0.0105')).toBe('1050')
})
