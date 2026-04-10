import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { execa } from 'execa'

function toSafeFileStem(command: string): string {
  return command.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
}

describe('integration: crawler + executor', () => {
  it('crawls nested commands from a real executable fixture', async () => {
    const fixtureCli = resolve('test/fixtures/fakecli.mjs')

    const { crawlCommandTree } = await import('../src/core/crawler.js')

    const tree = await crawlCommandTree(`node ${fixtureCli}`, {
      maxDepth: 3,
      timeoutMs: 2000,
    })

    const childPaths = tree.children.map((child) => child.path.slice(-1)[0])
    expect(childPaths).toEqual(['config', 'user'])

    const configNode = tree.children.find((node) => node.path.at(-1) === 'config')
    expect(configNode?.children.map((child) => child.path.at(-1))).toEqual(['set', 'get'])
  })

  it('generates docs end-to-end through the built CLI', async () => {
    const fixtureCli = resolve('test/fixtures/fakecli.mjs')
    const outDir = await mkdtemp(resolve(tmpdir(), 'doclix-e2e-'))

    try {
      await execa('node', [
        './dist/index.js',
        'generate',
        `node ${fixtureCli}`,
        '--max-depth=3',
        '--format=both',
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
})
