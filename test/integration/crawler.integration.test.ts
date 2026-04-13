import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { execa } from 'execa'

function toSafeFileStem(command: string): string {
  return command.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
}

describe('integration: crawler + executor', () => {
  it('crawls nested commands from a real executable fixture', async () => {
    const fixtureCli = resolve('test/integration/fixtures/fakecli.mjs')

    const { crawlCommandTree } = await import('../../src/core/crawler.js')

    const tree = await crawlCommandTree(`node ${fixtureCli}`, {
      maxDepth: 2,
      timeoutMs: 2000,
    })

    const childPaths = tree.children.map((child) => child.path.slice(-1)[0])
    expect(childPaths).toEqual(['config', 'user'])

    const configNode = tree.children.find((node) => node.path.at(-1) === 'config')
    expect(configNode?.children.map((child) => child.path.at(-1))).toEqual(['set', 'get'])
  })

  it('generates docs end-to-end through the built CLI', async () => {
    const fixtureCli = resolve('test/integration/fixtures/fakecli.mjs')
    const outDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-e2e-'))

    try {
      await execa('node', [
        './dist/index.js',
        'generate',
        `node ${fixtureCli}`,
        '--max-depth=2',
        '--format=json',
        '--format=md',
        `--output=${outDir}`,
      ])

      const stem = toSafeFileStem(`node ${fixtureCli}`)
      const jsonPath = resolve(outDir, `${stem}.json`)
      const markdownPath = resolve(outDir, `${stem}.md`)

      const jsonContent = await readFile(jsonPath, 'utf8')
      const markdownContent = await readFile(markdownPath, 'utf8')

      const parsed = JSON.parse(jsonContent) as { children: Array<{ path: string[]; children: Array<{ path: string[] }> }> }

      const topLevel = parsed.children.map((child) => child.path.at(-1))
      expect(topLevel).toEqual(['config', 'user'])
      expect(markdownContent).toContain('## node')
      expect(markdownContent).toContain('config')
      expect(markdownContent).toContain('user')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('deduplicates repeated format flags in the CLI', async () => {
    const fixtureCli = resolve('test/integration/fixtures/fakecli.mjs')
    const outDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-e2e-dedupe-'))

    try {
      const { stdout } = await execa('node', [
        './dist/index.js',
        'generate',
        `node ${fixtureCli}`,
        '--max-depth=1',
        '--format=json',
        '--format=json',
        '--format=md',
        '--format=md',
        `--output=${outDir}`,
      ])

      const stem = toSafeFileStem(`node ${fixtureCli}`)
      const jsonPath = resolve(outDir, `${stem}.json`)
      const markdownPath = resolve(outDir, `${stem}.md`)

      await expect(readFile(jsonPath, 'utf8')).resolves.toContain('"name": "fixture"')
      await expect(readFile(markdownPath, 'utf8')).resolves.toContain('config')

      const outputLines = stdout.split('\n')
      expect(outputLines.filter((line) => line.includes(`${stem}.json`))).toHaveLength(1)
      expect(outputLines.filter((line) => line.includes(`${stem}.md`))).toHaveLength(1)
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('writes a static html site as index.html', async () => {
    const fixtureCli = resolve('test/integration/fixtures/fakecli.mjs')
    const outDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-e2e-html-'))
    const readmePath = resolve(outDir, 'README.md')

    try {
      await writeFile(readmePath, '# Fixture README\n\nGenerated for integration testing.', 'utf8')

      await execa('node', [
        './dist/index.js',
        'generate',
        `node ${fixtureCli}`,
        '--max-depth=2',
        '--format=html',
        '--output-html-project-link=https://example.com/fakecli',
        `--output-html-readme=${readmePath}`,
        `--output=${outDir}`,
      ])

      const htmlPath = resolve(outDir, 'index.html')
      const htmlContent = await readFile(htmlPath, 'utf8')

      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('CLI Documentation')
      expect(htmlContent).toContain('id="theme-toggle"')
      expect(htmlContent).toContain('id="command-search"')
      expect(htmlContent).toContain('application/ld+json')
      expect(htmlContent).toContain('cmdgraph-search-index')
      expect(htmlContent).toContain('href="https://example.com/fakecli"')
      expect(htmlContent).toContain('<h1>Fixture README</h1>')
      expect(htmlContent).toContain('Generated for integration testing.')
      expect(htmlContent).toContain('config')
      expect(htmlContent).toContain('user')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('writes explicit llms.txt and sitemap.xml discovery artifacts', async () => {
    const fixtureCli = resolve('test/integration/fixtures/fakecli.mjs')
    const outDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-e2e-discovery-'))

    try {
      await execa('node', [
        './dist/index.js',
        'generate',
        `node ${fixtureCli}`,
        '--max-depth=2',
        '--format=llms-txt',
        '--format=sitemap',
        '--output-llms-txt-base-url=https://docs.example.com/fakecli/',
        '--output-sitemap-base-url=https://docs.example.com/fakecli/',
        `--output=${outDir}`,
      ])

      const llmsTxtPath = resolve(outDir, 'llms.txt')
      const sitemapPath = resolve(outDir, 'sitemap.xml')
      const llmsTxtContent = await readFile(llmsTxtPath, 'utf8')
      const sitemapContent = await readFile(sitemapPath, 'utf8')

      expect(llmsTxtContent).toContain('Primary HTML documentation: https://docs.example.com/fakecli/index.html')
      expect(llmsTxtContent).toContain('https://docs.example.com/fakecli/index.html#node')
      expect(sitemapContent).toContain('<loc>https://docs.example.com/fakecli/index.html</loc>')
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })

  it('fails if sitemap is requested without a site base url', async () => {
    const fixtureCli = resolve('test/integration/fixtures/fakecli.mjs')
    const outDir = await mkdtemp(resolve(tmpdir(), 'cmdgraph-e2e-sitemap-error-'))

    try {
      await expect(
        execa('node', [
          './dist/index.js',
          'generate',
          `node ${fixtureCli}`,
          '--max-depth=1',
          '--format=sitemap',
          `--output=${outDir}`,
        ]),
      ).rejects.toMatchObject({
        stderr: expect.stringContaining('--output-sitemap-base-url'),
      })
    } finally {
      await rm(outDir, { recursive: true, force: true })
    }
  })
})
