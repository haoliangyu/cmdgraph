import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
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

  it('introspects until leaves when maxDepth is omitted', async () => {
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
      ['tool alpha beta', 'Usage: tool alpha beta'],
    ])

    const result = await introspect('tool', {
      timeoutMs: 1000,
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(result.tree.children[0].path.join(' ')).toBe('tool alpha')
    expect(result.tree.children[0].children[0].path.join(' ')).toBe('tool alpha beta')
    expect(result.warnings).toEqual([])
  })

  it('generates all explicitly requested output formats in library mode', async () => {
    const outputs = new Map<string, string>([['tool', 'Usage: tool [command]']])

    const generated = await generate('tool', {
      'max-depth': 0,
      format: ['json', 'md', 'html', 'llms-txt', 'sitemap'],
      'output-llms-txt-base-url': 'https://docs.example.com/tool/',
      'output-sitemap-base-url': 'https://docs.example.com/tool/',
      timeout: 1000,
      concurrency: 1,
      parser: 'heuristic',
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(generated.tree.name).toBe('tool')
    expect(generated.json).toContain('"name": "tool"')
    expect(generated.markdown).toContain('## tool')
    expect(generated.html).toContain('<title>tool CLI Documentation</title>')
    expect(generated.llmsTxt).toContain('Primary HTML documentation: https://docs.example.com/tool/index.html')
    expect(generated.sitemap).toContain('<loc>https://docs.example.com/tool/index.html</loc>')
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

  it('requires output-sitemap-base-url for sitemap output in library mode', async () => {
    const outputs = new Map<string, string>([['tool', 'Usage: tool [command]']])

    await expect(
      generate('tool', {
        'max-depth': 0,
        format: ['sitemap'],
        timeout: 1000,
        concurrency: 1,
        parser: 'heuristic',
        executor: async (path) => outputs.get(path.join(' ')) ?? '',
      }),
    ).rejects.toThrow('output-sitemap-base-url is required when generating sitemap output')
  })

  it('supports overriding the displayed root command name across outputs', async () => {
    const outputs = new Map<string, string>([
      ['node ./dist/index.js', 'Usage: cmdgraph [command]'],
      ['node ./dist/index.js generate', 'Usage: cmdgraph generate COMMAND'],
    ])

    const generated = await generate('node ./dist/index.js', {
      'max-depth': 1,
      format: ['json', 'md', 'html'],
      'output-root-command-name': 'cmdgraph',
      timeout: 1000,
      concurrency: 1,
      parser: 'heuristic',
      executor: async (path) => outputs.get(path.join(' ')) ?? '',
    })

    expect(generated.tree.path).toEqual(['cmdgraph'])
    expect(generated.json).toContain('"path": [\n    "cmdgraph"')
    expect(generated.markdown).toContain('## cmdgraph')
    expect(generated.html).toContain('<title>cmdgraph CLI Documentation</title>')
  })

  it('supports html output customization options in library mode', async () => {
    const outputs = new Map<string, string>([['tool', 'Usage: tool [command]']])
    const tempDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-library-readme-'))
    const readmePath = resolve(tempDir, 'README.md')

    await writeFile(readmePath, '# Generated\n\nThis page is generated from CLI help output.', 'utf8')

    try {
      const generated = await generate('tool', {
        'max-depth': 0,
        format: ['html'],
        'output-html-title': 'Custom Tool Docs',
        'output-html-project-link': 'https://example.com/repo',
        'output-html-readme': readmePath,
        timeout: 1000,
        concurrency: 1,
        parser: 'heuristic',
        executor: async (path) => outputs.get(path.join(' ')) ?? '',
      })

      expect(generated.html).toContain('<title>Custom Tool Docs</title>')
      expect(generated.html).toContain('href="https://example.com/repo"')
      expect(generated.html).toContain('<h1>Generated</h1>')
      expect(generated.html).toContain('This page is generated from CLI help output.')
      expect(generated.warnings).toEqual([])
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('validates output-html-readme extension in library mode', async () => {
    const outputs = new Map<string, string>([['tool', 'Usage: tool [command]']])

    await expect(
      generate('tool', {
        'max-depth': 0,
        format: ['html'],
        'output-html-readme': './README.txt',
        timeout: 1000,
        concurrency: 1,
        parser: 'heuristic',
        executor: async (path) => outputs.get(path.join(' ')) ?? '',
      }),
    ).rejects.toThrow('output-html-readme must point to a .md file')
  })
})
