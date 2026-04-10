import { describe, expect, it } from 'vitest'
import { formatAsSitemap } from '../../src/formatters/sitemap.js'
import type { CommandNode } from '../../src/types.js'

describe('formatAsSitemap', () => {
	it('renders a sitemap for the hosted html page', () => {
		const root: CommandNode = {
			name: 'tool',
			description: 'A test command.',
			usage: 'tool [command]',
			aliases: [],
			arguments: [],
			examples: [],
			options: [],
			subcommands: [],
			path: ['tool'],
			children: [],
		}

		const output = formatAsSitemap(root, { siteBaseUrl: 'https://docs.example.com/tool/' })

		expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>')
		expect(output).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
		expect(output).toContain('<loc>https://docs.example.com/tool/index.html</loc>')
	})
})