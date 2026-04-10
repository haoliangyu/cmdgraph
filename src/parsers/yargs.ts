import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class YargsParser implements CLIParser {
  public readonly name = 'yargs'

  detect(helpText: string): boolean {
    const hasUsage = /^\s*Usage:\s+\S+/im.test(helpText)
    const hasYargsHelpText = /show help/i.test(helpText)
    const hasYargsVersionText = /show version number/i.test(helpText)
    const hasBooleanTypeHints = /\[(?:boolean|string|number)\]/i.test(helpText)

    return hasUsage && hasYargsHelpText && hasYargsVersionText && hasBooleanTypeHints
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const yargsParser = new YargsParser()
