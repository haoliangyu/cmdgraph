import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class ArgparseParser implements CLIParser {
  public readonly name = 'argparse'

  detect(helpText: string): boolean {
    const hasUsage = /^\s*usage:\s+\S+/im.test(helpText)
    const hasHelpMessage = /show this help message and exit/i.test(helpText)
    const hasArgparseSections = /(positional arguments:|optional arguments:|options:)/i.test(helpText)

    return hasUsage && hasHelpMessage && hasArgparseSections
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const argparseParser = new ArgparseParser()
