import { describe, expect, it } from 'vitest'
import { normalizeFormats } from '../../src/formatters/formats.js'

describe('output format selection', () => {
	it('defaults to json when format is omitted', () => {
		expect(normalizeFormats(undefined)).toEqual(['json'])
	})

	it('accepts a single format string', () => {
		expect(normalizeFormats('md')).toEqual(['md'])
	})

	it('deduplicates repeated formats while preserving order', () => {
		expect(normalizeFormats(['json', 'json', 'md', 'md', 'json'])).toEqual(['json', 'md'])
	})
})