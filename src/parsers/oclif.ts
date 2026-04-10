import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class OclifParser implements CLIParser {
  public readonly name = 'oclif'

  detect(helpText: string): boolean {
    return /oclif/i.test(helpText)
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const oclifParser = new OclifParser()
