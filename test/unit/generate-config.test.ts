import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  getProvidedLongFlagNames,
  loadGenerateConfigFlags,
  parseGenerateConfigObject,
} from '../../src/core/generate-config.js'

describe('generate config helpers', () => {
  it('parses flat and nested JSON config keys into generate flags', () => {
    const parsed = parseGenerateConfigObject({
      maxDepth: 3,
      output: {
        format: ['json', 'md'],
        directory: './site',
        rootCommandName: 'cmdgraph',
        html: {
          title: 'cmdgraph docs',
          projectLink: 'https://example.com/repo',
          readme: './README.md',
        },
        llmsTxt: {
          baseUrl: 'https://docs.example.com/cmdgraph/',
        },
        sitemap: {
          baseUrl: 'https://docs.example.com/cmdgraph/',
        },
      },
      crawler: {
        timeout: 9000,
        concurrency: 2,
        parser: 'heuristic',
      },
    })

    expect(parsed).toEqual({
      'max-depth': 3,
      format: ['json', 'md'],
      output: './site',
      timeout: 9000,
      concurrency: 2,
      parser: 'heuristic',
      'output-root-command-name': 'cmdgraph',
      'output-html-title': 'cmdgraph docs',
      'output-html-project-link': 'https://example.com/repo',
      'output-html-readme': './README.md',
      'output-llms-txt-base-url': 'https://docs.example.com/cmdgraph/',
      'output-sitemap-base-url': 'https://docs.example.com/cmdgraph/',
    })
  })

  it('collects provided long flag names from argv tokens', () => {
    const provided = getProvidedLongFlagNames([
      'node ./dist/index.js',
      '--max-depth=2',
      '--output',
      './docs',
      '--format=json',
      '--format=md',
      '--config=./custom.json',
    ])

    expect(provided.has('max-depth')).toBe(true)
    expect(provided.has('output')).toBe(true)
    expect(provided.has('format')).toBe(true)
    expect(provided.has('config')).toBe(true)
  })

  it('returns empty config for missing default file', async () => {
    const tempDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-config-default-missing-'))

    try {
      await expect(loadGenerateConfigFlags(resolve(tempDir, 'missing.json'), { required: false })).resolves.toEqual({})
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('throws for missing required config file', async () => {
    const tempDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-config-required-missing-'))

    try {
      await expect(loadGenerateConfigFlags(resolve(tempDir, 'missing.json'), { required: true })).rejects.toThrow(
        'Config file not found',
      )
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('throws for invalid config value type', async () => {
    const tempDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-config-invalid-'))
    const configPath = resolve(tempDir, 'cmdgraph.config.json')

    try {
      await writeFile(configPath, JSON.stringify({ timeout: 'fast' }), 'utf8')

      await expect(loadGenerateConfigFlags(configPath, { required: true })).rejects.toThrow('Expected a number')
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
