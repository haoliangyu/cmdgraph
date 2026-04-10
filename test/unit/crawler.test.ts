import { describe, expect, it } from 'vitest'
import { crawlCommandTree } from '../../src/core/crawler.js'

describe('crawlCommandTree', () => {
  it('builds a nested command tree from mocked executor output', async () => {
    const outputs = new Map<string, string>([
      [
        'tool',
        [
          'Usage: tool [command]',
          '',
          'Commands:',
          '  alpha    Alpha command',
          '  beta     Beta command',
        ].join('\n'),
      ],
      [
        'tool alpha',
        [
          'Usage: tool alpha [command]',
          '',
          'Commands:',
          '  gamma    Gamma command',
        ].join('\n'),
      ],
      ['tool alpha gamma', 'Usage: tool alpha gamma'],
      ['tool beta', 'Usage: tool beta'],
    ])

    const tree = await crawlCommandTree('tool', {
      maxDepth: 3,
      timeoutMs: 1000,
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(tree.path).toEqual(['tool'])
    expect(tree.children.map((child) => child.path.join(' '))).toEqual(['tool alpha', 'tool beta'])

    const alpha = tree.children[0]
    expect(alpha.children.map((child) => child.path.join(' '))).toEqual(['tool alpha gamma'])
  })

  it('respects max depth', async () => {
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
      [
        'tool alpha',
        [
          'Usage: tool alpha [command]',
          '',
          'Commands:',
          '  gamma    Gamma command',
        ].join('\n'),
      ],
    ])

    const tree = await crawlCommandTree('tool', {
      maxDepth: 1,
      timeoutMs: 1000,
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(tree.children).toHaveLength(1)
    expect(tree.children[0].children).toHaveLength(0)
  })
})
