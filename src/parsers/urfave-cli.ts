import type { CLIParser } from '../core/parser.js'
import type { ParsedCommand } from '../types.js'
import { heuristicParser } from './heuristic.js'

export class UrfaveCliParser implements CLIParser {
  public readonly name = 'urfave-cli'

  detect(helpText: string): boolean {
    const hasNameHeading = /^\s*NAME:\s*$/im.test(helpText)
    const hasUsageHeading = /^\s*USAGE:\s*$/im.test(helpText)
    const hasCommandsHeading = /^\s*COMMANDS:\s*$/im.test(helpText)
    const hasGlobalOptionsHeading = /^\s*GLOBAL OPTIONS:\s*$/im.test(helpText)

    return hasNameHeading && hasUsageHeading && hasCommandsHeading && hasGlobalOptionsHeading
  }

  parse(helpText: string): ParsedCommand {
    return heuristicParser.parse(helpText)
  }
}

export const urfaveCliParser = new UrfaveCliParser()
