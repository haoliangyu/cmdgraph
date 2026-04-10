import { describe, expect, it } from 'vitest'
import { normalizeFormats } from '../../src/formatters/formats.js'

describe('output format selection', () => {
	it('defaults to json when format is omitted', () => {
		expect(normalizeFormats(undefined)).toEqual(['json'])
	})

	it('accepts a single format string', () => {
		expect(normalizeFormats('md')).toEqual(['md'])
	})

	it('accepts html as a selectable format', () => {
		expect(normalizeFormats('html')).toEqual(['html'])
	})

	it('accepts explicit discovery formats', () => {
		expect(normalizeFormats(['llms-txt', 'sitemap'])).toEqual(['llms-txt', 'sitemap'])
	})

	it('deduplicates repeated formats while preserving order', () => {
		expect(normalizeFormats(['json', 'json', 'html', 'llms-txt', 'md', 'html', 'sitemap', 'json'])).toEqual([
			'json',
			'html',
			'llms-txt',
			'md',
			'sitemap',
		])
	})
})