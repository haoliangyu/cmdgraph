import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class SystemCommandLineParser implements CLIParser {
  public readonly name = 'system-commandline'

  detect(helpText: string): boolean {
    const hasUsageHeading = /^\s*Usage:\s*$/im.test(helpText)
    const hasOptionsHeading = /^\s*Options:\s*$/im.test(helpText)
    const hasSystemCommandLineHelpText = /show help and usage information\.?/i.test(helpText)

    return hasUsageHeading && hasOptionsHeading && hasSystemCommandLineHelpText
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const systemCommandLineParser = new SystemCommandLineParser()
