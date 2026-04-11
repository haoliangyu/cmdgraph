import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

function normalizeThorHelpText(helpText: string): string {
  const rootCommand = helpText.match(/^\s*Usage:\s+(\S+)/im)?.[1]
  if (!rootCommand) {
    return helpText
  }

  const normalized: string[] = []
  let inCommandSection = false

  for (const rawLine of helpText.split(/\r?\n/)) {
    if (/^\s*(Commands|Tasks):\s*$/i.test(rawLine)) {
      inCommandSection = true
      normalized.push(rawLine)
      continue
    }

    if (inCommandSection && /^\s*[A-Za-z][A-Za-z ]+:\s*$/.test(rawLine)) {
      inCommandSection = false
      normalized.push(rawLine)
      continue
    }

    if (inCommandSection) {
      const escapedRoot = rootCommand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      normalized.push(rawLine.replace(new RegExp(`^(\\s*)${escapedRoot}\\s+`), '$1'))
      continue
    }

    normalized.push(rawLine)
  }

  return normalized.join('\n')
}

export class ThorParser implements CLIParser {
  public readonly name = 'thor'

  detect(helpText: string): boolean {
    const hasThorStyleUsage = /^\s*Usage:\s+\S+\s+(COMMAND|TASK)\s+\[ARGS\]/im.test(helpText)
    const hasCommandsOrTasksHeading = /^\s*(Commands|Tasks):\s*$/im.test(helpText)
    const hasThorHelpCommand = /\b(?:thor|rails)\s+help\s+\[COMMAND\]/i.test(helpText)

    return hasThorStyleUsage && (hasCommandsOrTasksHeading || hasThorHelpCommand)
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(normalizeThorHelpText(helpText))
  }
}

export const thorParser = new ThorParser()
