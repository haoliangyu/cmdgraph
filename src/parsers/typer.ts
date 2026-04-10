import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

function normalizeTyperHelpText(helpText: string): string {
  const normalized: string[] = []

  for (const rawLine of helpText.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line) {
      normalized.push('')
      continue
    }

    if (/^[╭╰─]+$/.test(line)) {
      continue
    }

    if (/options/i.test(line) && /[╭╰│]/.test(rawLine)) {
      normalized.push('Options:')
      continue
    }

    if (/commands/i.test(line) && /[╭╰│]/.test(rawLine)) {
      normalized.push('Commands:')
      continue
    }

    const stripped = rawLine.replace(/^[\s│]+/, '').replace(/\s*│\s*$/, '').trimEnd()
    if (stripped.length > 0) {
      normalized.push(stripped)
    }
  }

  return normalized.join('\n')
}

export class TyperParser implements CLIParser {
  public readonly name = 'typer'

  detect(helpText: string): boolean {
    const hasUsage = /^\s*Usage:\s+\S+/im.test(helpText)
    const hasTyperCompletionFlags = /--install-completion|--show-completion/i.test(helpText)
    const hasClickHelpText = /show this message and exit/i.test(helpText)

    return hasUsage && hasTyperCompletionFlags && hasClickHelpText
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(normalizeTyperHelpText(helpText))
  }
}

export const typerParser = new TyperParser()
