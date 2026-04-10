import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class ClapParser implements CLIParser {
  public readonly name = 'clap'

  detect(helpText: string): boolean {
    const hasUsage = /^\s*Usage:\s+\S+/im.test(helpText)
    const hasClapHelpText = /\bPrint help\b/i.test(helpText)
    const hasClapVersionText = /\bPrint version\b/i.test(helpText)

    return hasUsage && hasClapHelpText && hasClapVersionText
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const clapParser = new ClapParser()
