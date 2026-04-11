import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createDefaultParserRegistry } from '../../src/core/parser-registry.js'

async function fixture(name: string): Promise<string> {
  return readFile(resolve('test/unit/fixtures', name), 'utf8')
}

describe('framework parsers', () => {
  it('detects and parses oclif output', async () => {
    const helpText = await fixture('oclif-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('oclif')
    expect(parsed.name).toBe('acme')
    expect(parsed.subcommands).toEqual(['login', 'status'])
  })

  it('detects and parses Commander.js output', async () => {
    const helpText = await fixture('commander-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('commander')
    expect(parsed.name).toBe('acme')
    expect(parsed.subcommands).toEqual(['init', 'deploy'])
  })

  it('detects and parses Cobra output', async () => {
    const helpText = await fixture('cobra-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('cobra')
    expect(parsed.name).toBe('acmectl')
    expect(parsed.subcommands).toEqual(['get', 'apply'])
  })

  it('detects and parses Thor output', async () => {
    const helpText = await fixture('thor-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('thor')
    expect(parsed.name).toBe('thor')
    expect(parsed.subcommands).toEqual(['help', 'list'])
  })

  it('detects and parses picocli output', async () => {
    const helpText = await fixture('picocli-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('picocli')
    expect(parsed.name).toBe('acme')
    expect(parsed.subcommands).toEqual(['init', 'deploy'])
  })

  it('detects and parses urfave/cli output', async () => {
    const helpText = await fixture('urfave-cli-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('urfave-cli')
    expect(parsed.name).toBe('greet')
    expect(parsed.subcommands).toEqual(['hello', 'help'])
  })

  it('detects and parses Click output', async () => {
    const helpText = await fixture('click-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('click')
    expect(parsed.name).toBe('flask')
    expect(parsed.subcommands).toEqual(['run', 'shell'])
  })

  it('detects and parses clap output', async () => {
    const helpText = await fixture('clap-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('clap')
    expect(parsed.name).toBe('rg')
    expect(parsed.subcommands).toEqual(['help'])
  })

  it('detects and parses yargs output', async () => {
    const helpText = await fixture('yargs-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('yargs')
    expect(parsed.name).toBe('mytool')
    expect(parsed.subcommands).toEqual(['serve', 'lint'])
  })

  it('detects and parses argparse output', async () => {
    const helpText = await fixture('argparse-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('argparse')
    expect(parsed.name).toBe('app.py')
    expect(parsed.options.some((option) => option.flag.includes('--verbose'))).toBe(true)
  })

  it('detects and parses Typer output', async () => {
    const helpText = await fixture('typer-help.txt')
    const parser = createDefaultParserRegistry().select(helpText)
    const parsed = parser.parse(helpText)

    expect(parser.name).toBe('typer')
    expect(parsed.name).toBe('app')
    expect(parsed.subcommands).toEqual(['run', 'info'])
    expect(parsed.options.some((option) => option.flag.includes('--help'))).toBe(true)
  })
})
