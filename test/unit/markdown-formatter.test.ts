import { describe, expect, it } from 'vitest'
import { formatAsMarkdown } from '../../src/formatters/markdown.js'
import type { CommandNode } from '../../src/types.js'

describe('formatAsMarkdown', () => {
  it('renders aliases, arguments, and examples', () => {
    const root: CommandNode = {
      name: 'tool',
      description: 'A test command.',
      usage: 'tool <source> [DEST]',
      aliases: ['t', 'tl'],
      arguments: ['<source>', 'DEST'],
      examples: ['tool ./input ./output'],
      options: [{ flag: '-h, --help', description: 'Show help' }],
      subcommands: ['inspect'],
      path: ['tool'],
      children: [],
    }

    const markdown = formatAsMarkdown(root)

    expect(markdown).toContain('**Aliases:** `t`, `tl`')
    expect(markdown).toContain('**Arguments**')
    expect(markdown).toContain('- `<source>`')
    expect(markdown).toContain('- `DEST`')
    expect(markdown).toContain('**Examples**')
    expect(markdown).toContain('- `tool ./input ./output`')
  })
})
