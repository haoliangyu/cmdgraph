import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class CommandLineParserParser implements CLIParser {
  public readonly name = 'commandlineparser'

  detect(helpText: string): boolean {
    const hasUsageHeading = /^\s*USAGE:\s+\S+/im.test(helpText)
    const hasOptionsHeading = /^\s*OPTIONS:\s*$/im.test(helpText)
    const hasCommandLineParserHelpText = /display this help screen\.?/i.test(helpText)
    const hasCommandLineParserVersionText = /display version information\.?/i.test(helpText)

    return hasUsageHeading && hasOptionsHeading && hasCommandLineParserHelpText && hasCommandLineParserVersionText
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const commandLineParserParser = new CommandLineParserParser()
