import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class CommanderParser implements CLIParser {
  public readonly name = 'commander'

  detect(helpText: string): boolean {
    const hasUsage = /^\s*Usage:\s+\S+/im.test(helpText)
    const hasCommanderHelpText = /display help for command/i.test(helpText)
    const hasCommanderVersionText = /output the version number/i.test(helpText)

    return hasUsage && hasCommanderHelpText && hasCommanderVersionText
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const commanderParser = new CommanderParser()
