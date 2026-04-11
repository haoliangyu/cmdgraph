import { describe, expect, it } from 'vitest'
import { formatAsHtml } from '../../src/formatters/html.js'
import type { CommandNode } from '../../src/types.js'

describe('formatAsHtml', () => {
	it('renders a static accessible single-page document with theme support', () => {
		const root: CommandNode = {
			name: 'tool',
			description: 'A test command.',
			usage: 'tool [command]',
			aliases: ['tl'],
			arguments: ['<input>'],
			examples: ['tool inspect ./fixture'],
			options: [{ flag: '-h, --help', description: 'Show help' }],
			subcommands: ['inspect'],
			path: ['tool'],
			children: [
				{
					name: 'inspect',
					description: 'Inspect a fixture.',
					usage: 'tool inspect <input>',
					aliases: [],
					arguments: ['<input>'],
					examples: [],
					options: [],
					subcommands: [],
					path: ['tool', 'inspect'],
					children: [],
				},
			],
		}

		const html = formatAsHtml(root)

		expect(html).toContain('<!DOCTYPE html>')
		expect(html).toContain('<title>tool CLI Documentation</title>')
		expect(html).toContain('https://cdn.tailwindcss.com?plugins=typography')
		expect(html).toContain('id="theme-toggle"')
		expect(html).toContain('aria-label="Toggle dark mode"')
		expect(html).toContain('id="command-search"')
		expect(html).toContain('Filter by command, option, alias, or usage')
		expect(html).toContain('Skip to content')
		expect(html).not.toContain('Source of truth: JSON')
		expect(html).not.toContain('Overview')
		expect(html).toContain('tool inspect')
		expect(html).toContain('application/ld+json')
		expect(html).toContain('cmdgraph-search-index')
		expect(html).toContain('TechArticle')
		expect(html).toContain('Live filter for command sections and the page index')
		expect(html).toContain("const storageKey = 'cmdgraph-theme'")
		expect(html).toContain('Showing all commands.')
	})
})