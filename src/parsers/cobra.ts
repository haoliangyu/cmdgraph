import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class CobraParser implements CLIParser {
  public readonly name = 'cobra'

  detect(helpText: string): boolean {
    return /available commands|flags:/i.test(helpText)
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const cobraParser = new CobraParser()
