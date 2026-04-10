import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class ClickParser implements CLIParser {
  public readonly name = 'click'

  detect(helpText: string): boolean {
    const hasClickUsage = /^\s*Usage:\s+\S+.*\[OPTIONS\]/im.test(helpText)
    const hasClickHelpLine = /show this message and exit\.?/i.test(helpText)

    return hasClickUsage && hasClickHelpLine
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const clickParser = new ClickParser()
