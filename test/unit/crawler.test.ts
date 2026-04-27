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

  it('crawls until leaf nodes when max depth is unset', async () => {
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
          '  beta    Beta command',
        ].join('\n'),
      ],
      [
        'tool alpha beta',
        [
          'Usage: tool alpha beta [command]',
          '',
          'Commands:',
          '  gamma    Gamma command',
        ].join('\n'),
      ],
      ['tool alpha beta gamma', 'Usage: tool alpha beta gamma'],
    ])

    const tree = await crawlCommandTree('tool', {
      timeoutMs: 1000,
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    const alpha = tree.children[0]
    const beta = alpha.children[0]
    expect(beta.path).toEqual(['tool', 'alpha', 'beta'])
    expect(beta.children[0].path).toEqual(['tool', 'alpha', 'beta', 'gamma'])
  })

  it('falls back to command token when parser returns unknown name', async () => {
    const tree = await crawlCommandTree('gh', {
      maxDepth: 1,
      timeoutMs: 1000,
      executor: async () => '',
    })

    expect(tree.name).toBe('gh')
    expect(tree.path).toEqual(['gh'])
  })

  it('limits concurrent child help execution', async () => {
    let active = 0
    let maxActive = 0

    const outputs = new Map<string, string>([
      [
        'tool',
        [
          'Usage: tool [command]',
          '',
          'Commands:',
          '  alpha    Alpha command',
          '  beta     Beta command',
          '  gamma    Gamma command',
        ].join('\n'),
      ],
      ['tool alpha', 'Usage: tool alpha'],
      ['tool beta', 'Usage: tool beta'],
      ['tool gamma', 'Usage: tool gamma'],
    ])

    const tree = await crawlCommandTree('tool', {
      concurrency: 2,
      maxDepth: 1,
      timeoutMs: 1000,
      executor: async (path) => {
        active += 1
        maxActive = Math.max(maxActive, active)

        await new Promise((resolve) => setTimeout(resolve, 25))

        active -= 1
        return outputs.get(path.join(' ')) ?? ''
      },
    })

    expect(tree.children).toHaveLength(3)
    expect(maxActive).toBeLessThanOrEqual(2)
    expect(maxActive).toBeGreaterThan(1)
  })

  it('probes version output when help text does not include a version', async () => {
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

    const versionOutputs = new Map<string, string>([
      ['tool', 'tool version 9.8.7'],
      ['tool alpha', ''],
    ])

    const tree = await crawlCommandTree('tool', {
      maxDepth: 1,
      timeoutMs: 1000,
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
      versionExecutor: async (path) => versionOutputs.get(path.join(' ')) ?? '',
    })

    expect(tree.version).toBe('9.8.7')
    expect(tree.children[0]?.version).toBeUndefined()
  })
})
