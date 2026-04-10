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

  it('extracts name from standalone USAGE heading blocks', () => {
    const parsed = heuristicParser.parse(`Work seamlessly with GitHub from the command line.

USAGE
  gh <command> <subcommand> [flags]

CORE COMMANDS
  auth        Authenticate gh and git with GitHub
`)

    expect(parsed.name).toBe('gh')
    expect(parsed.usage).toContain('gh')
  })

  it('parses short flags including uppercase variants', () => {
    const parsed = heuristicParser.parse(`Usage: cp [OPTION]... SOURCE DEST

Options:
  -h  --help                        display this help and exit
  -H                                follow command-line symbolic links in SOURCE
`)

    expect(parsed.options.some((option) => option.flag.includes('-h'))).toBe(true)
    expect(parsed.options.some((option) => option.flag.includes('-H'))).toBe(true)
    expect(parsed.options.some((option) => option.flag.includes('--help'))).toBe(true)
  })

  it('extracts aliases, arguments, and examples', () => {
    const parsed = heuristicParser.parse(`Usage: tool <source> [DEST]

Aliases: t, tl

Arguments:
  <source>         Input source
  [DEST]           Output destination

Examples:
  tool ./input ./output
  tool --help
`)

    expect(parsed.aliases).toEqual(['t', 'tl'])
    expect(parsed.arguments).toEqual(['<source>', 'DEST'])
    expect(parsed.examples).toEqual(['tool ./input ./output', 'tool --help'])
  })
})
