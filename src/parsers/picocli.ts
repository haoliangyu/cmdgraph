import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class PicocliParser implements CLIParser {
  public readonly name = 'picocli'

  detect(helpText: string): boolean {
    const hasUsage = /^\s*Usage:\s+\S+/im.test(helpText)
    const hasPicocliHelpText = /show this help message and exit\.?/i.test(helpText)
    const hasPicocliVersionText = /print version information and exit\.?/i.test(helpText)

    return hasUsage && hasPicocliHelpText && hasPicocliVersionText
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const picocliParser = new PicocliParser()
