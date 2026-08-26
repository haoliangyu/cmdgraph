import type { CLIParser } from '../core/parser.js'
import { extractVersionFromText } from '../core/version.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function commandPrefixFromUsage(usage: string): string {
  const prefix: string[] = []

  for (const token of usage.split(/\s+/).filter(Boolean)) {
    if (/^[<\[]/.test(token) || /^\[options\]$/i.test(token)) {
      break
    }

    prefix.push(token.replace(/^\$/, ''))
  }

  return prefix.join(' ')
}

function usageFromHeading(helpText: string): string | undefined {
  const match = helpText.match(/^\s*Usage:\s+(\S.*)$/im)
  return match?.[1]?.trim()
}

function isBannerUsageLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed || trimmed.includes(':') || trimmed.startsWith('-')) {
    return false
  }

  if (extractVersionFromText(trimmed) && !/[<\[]/.test(trimmed)) {
    return false
  }

  return /^[A-Za-z0-9._-]+(?:\s+\S+)+$/.test(trimmed) && /[<\[]/.test(trimmed)
}

function extractCommandPrefix(helpText: string): string | undefined {
  const fromHeading = usageFromHeading(helpText)
  if (fromHeading) {
    return commandPrefixFromUsage(fromHeading)
  }

  for (const raw of helpText.split(/\r?\n/)) {
    if (isBannerUsageLine(raw)) {
      return commandPrefixFromUsage(raw.trim())
    }
  }

  return undefined
}

function normalizeYargsHelpText(helpText: string): string {
  const hasUsageHeading = /^\s*Usage:\s+\S+/im.test(helpText)
  const prefix = extractCommandPrefix(helpText)
  const prefixPattern = prefix
    ? new RegExp(`^(\\s*)(?:\\$0|${escapeRegExp(prefix)})(?:\\s+|$)`)
    : undefined
  const normalized: string[] = []
  let inCommandSection = false

  for (const rawLine of helpText.split(/\r?\n/)) {
    const trimmed = rawLine.trim()

    if (/^Documentation:\s*/i.test(trimmed)) {
      continue
    }

    if (/^\s*Positionals:\s*$/i.test(rawLine)) {
      inCommandSection = false
      normalized.push(rawLine.replace(/Positionals:/i, 'Arguments:'))
      continue
    }

    if (/^\s*Commands:\s*$/i.test(rawLine)) {
      inCommandSection = true
      normalized.push(rawLine)
      continue
    }

    if (inCommandSection && /^\s*[A-Za-z][A-Za-z ]+:\s*$/.test(rawLine)) {
      inCommandSection = false
      normalized.push(rawLine)
      continue
    }

    if (!hasUsageHeading && isBannerUsageLine(rawLine)) {
      normalized.push(`Usage: ${trimmed}`)
      continue
    }

    if (inCommandSection) {
      const withoutDollarZero = rawLine.replace(/^(\s*)\$0\s+/, '$1')
      normalized.push(prefixPattern ? withoutDollarZero.replace(prefixPattern, '$1') : withoutDollarZero)
      continue
    }

    normalized.push(rawLine)
  }

  return normalized.join('\n')
}

export class YargsParser implements CLIParser {
  public readonly name = 'yargs'

  detect(helpText: string): boolean {
    const hasYargsHelpText = /show help/i.test(helpText)
    const hasYargsVersionText = /show version number/i.test(helpText)
    const hasTypeHints = /\[(?:boolean|string|number|array|count)\]/i.test(helpText)

    return hasYargsHelpText && hasYargsVersionText && hasTypeHints
  }

  parse(helpText: string): ParsedCommand {
    const normalized = normalizeYargsHelpText(helpText)
    const parsed = heuristicParser.parse(normalized)
    const prefix = extractCommandPrefix(normalized)
    const name = prefix?.split(/\s+/).filter(Boolean).at(-1)
    const hasCommandSection = /^\s*Commands:\s*$/im.test(normalized)

    return {
      ...parsed,
      ...(name ? { name } : {}),
      subcommands: hasCommandSection ? parsed.subcommands : [],
    }
  }
}

export const yargsParser = new YargsParser()
