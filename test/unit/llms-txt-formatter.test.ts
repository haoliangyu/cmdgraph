import { describe, expect, it } from 'vitest'
import { formatAsLlmsTxt } from '../../src/formatters/llms-txt.js'
import type { CommandNode } from '../../src/types.js'

describe('formatAsLlmsTxt', () => {
	it('renders command inventory with explicit links', () => {
		const root: CommandNode = {
			name: 'tool',
			description: 'A test command.',
			usage: 'tool [command]',
			aliases: ['tl'],
			arguments: [],
			examples: [],
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

		const output = formatAsLlmsTxt(root, { siteBaseUrl: 'https://docs.example.com/cli/' })

		expect(output).toContain('# tool CLI Documentation')
		expect(output).toContain('Primary HTML documentation: https://docs.example.com/cli/index.html')
		expect(output).toContain('URL: https://docs.example.com/cli/index.html#tool-inspect')
		expect(output).toContain('Options: -h, --help')
	})
})