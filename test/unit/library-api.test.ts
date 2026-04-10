import { describe, expect, it } from 'vitest'
import { generate, introspect } from '../../src/index.js'

describe('library API', () => {
  it('introspects command tree programmatically', async () => {
    const outputs = new Map<string, string>([
      [
        'tool',
        [
          'Usage: tool [command]',
          '',
          'Commands:',
          '  alpha    Alpha command',
        ].join('\n'),
      ],
      ['tool alpha', 'Usage: tool alpha'],
    ])

    const result = await introspect('tool', {
      maxDepth: 1,
      timeoutMs: 1000,
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(result.tree.name).toBe('tool')
    expect(result.tree.children.map((child) => child.path.join(' '))).toEqual(['tool alpha'])
    expect(result.warnings).toEqual([])
  })

  it('generates JSON and Markdown content in library mode', async () => {
    const outputs = new Map<string, string>([['tool', 'Usage: tool [command]']])

    const generated = await generate('tool', {
      'max-depth': 0,
      format: ['json', 'md'],
      timeout: 1000,
      concurrency: 1,
      parser: 'heuristic',
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(generated.tree.name).toBe('tool')
    expect(generated.json).toContain('"name": "tool"')
    expect(generated.markdown).toContain('## tool')
    expect(generated.warnings).toEqual([])
  })

  it('defaults to JSON output when no format is provided', async () => {
    const outputs = new Map<string, string>([['tool', 'Usage: tool [command]']])

    const generated = await generate('tool', {
      'max-depth': 0,
      timeout: 1000,
      concurrency: 1,
      parser: 'heuristic',
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(generated.json).toContain('"name": "tool"')
    expect(generated.markdown).toBeUndefined()
  })
})
