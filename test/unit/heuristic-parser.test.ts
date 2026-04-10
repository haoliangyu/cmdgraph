import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { heuristicParser } from '../../src/parsers/heuristic.js'

async function fixture(name: string): Promise<string> {
  return readFile(resolve('test/unit/fixtures', name), 'utf8')
}

describe('heuristicParser', () => {
  it('parses git fixture', async () => {
    const parsed = heuristicParser.parse(await fixture('git-help.txt'))

    expect(parsed.name).toBe('git')
    expect(parsed.subcommands).toEqual(['add', 'commit', 'push'])
    expect(parsed.options.length).toBeGreaterThan(0)
  })

  it('parses docker fixture', async () => {
    const parsed = heuristicParser.parse(await fixture('docker-help.txt'))

    expect(parsed.name).toBe('docker')
    expect(parsed.subcommands).toContain('run')
    expect(parsed.options.some((option) => option.flag.includes('--config'))).toBe(true)
  })

  it('parses kubectl fixture', async () => {
    const parsed = heuristicParser.parse(await fixture('kubectl-help.txt'))

    expect(parsed.name).toBe('kubectl')
    expect(parsed.subcommands).toContain('apply')
    expect(parsed.options.some((option) => option.flag.includes('--namespace'))).toBe(true)
  })

  it('parses real-world git help with categorized command blocks', async () => {
    const parsed = heuristicParser.parse(await fixture('git-realworld-help.txt'))

    expect(parsed.name).toBe('git')
    expect(parsed.description).toBe('These are common Git commands used in various situations:')
    expect(parsed.subcommands).toEqual(['clone', 'init', 'add', 'mv', 'restore', 'log', 'status'])
  })

  it('parses real-world gh help with core/additional command sections', async () => {
    const parsed = heuristicParser.parse(await fixture('gh-realworld-help.txt'))

    expect(parsed.name).toBe('gh')
    expect(parsed.subcommands).toEqual(['auth', 'repo', 'pr', 'alias', 'completion'])
    expect(parsed.options.some((option) => option.flag.includes('--help'))).toBe(true)
  })
})
