import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

function normalizeOclifHelpText(helpText: string): string {
  const headingMap = new Map<string, string>([
    ['VERSION', 'Version:'],
    ['USAGE', 'Usage:'],
    ['COMMANDS', 'Commands:'],
    ['TOPICS', 'Commands:'],
    ['FLAGS', 'Flags:'],
    ['GLOBAL FLAGS', 'Global Flags:'],
  ])

  return helpText
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim().toUpperCase()
      const normalizedHeading = headingMap.get(trimmed)
      return normalizedHeading ? normalizedHeading : line
    })
    .join('\n')
}

export class OclifParser implements CLIParser {
  public readonly name = 'oclif'

  detect(helpText: string): boolean {
    if (/oclif/i.test(helpText)) {
      return true
    }

    const hasOclifSections = /^\s*USAGE\s*$/m.test(helpText) && /^\s*COMMANDS\s*$/m.test(helpText)
    const hasDollarUsage = /^\s*\$\s+\S+/m.test(helpText)

    return hasOclifSections && hasDollarUsage
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(normalizeOclifHelpText(helpText))
  }
}

export const oclifParser = new OclifParser()
