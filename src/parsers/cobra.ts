import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class CobraParser implements CLIParser {
  public readonly name = 'cobra'

  detect(helpText: string): boolean {
    const hasUsage = /^\s*Usage:\s+\S+/im.test(helpText)
    const hasAvailableCommandsHeading = /^\s*Available Commands:\s*$/im.test(helpText)
    const hasFlagsHeading = /^\s*(Flags|Global Flags):\s*$/im.test(helpText)

    return hasUsage && (hasAvailableCommandsHeading || hasFlagsHeading)
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const cobraParser = new CobraParser()
