import type { CLIParser } from './parser.js'
import { argparseParser } from '../parsers/argparse.js'
import { cobraParser } from '../parsers/cobra.js'
import { clapParser } from '../parsers/clap.js'
import { clickParser } from '../parsers/click.js'
import { commanderParser } from '../parsers/commander.js'
import { heuristicParser } from '../parsers/heuristic.js'
import { oclifParser } from '../parsers/oclif.js'
import { picocliParser } from '../parsers/picocli.js'
import { thorParser } from '../parsers/thor.js'
import { typerParser } from '../parsers/typer.js'
import { urfaveCliParser } from '../parsers/urfave-cli.js'
import { yargsParser } from '../parsers/yargs.js'

export class ParserRegistry {
  private readonly parsers: CLIParser[] = []

  constructor(parsers: CLIParser[] = []) {
    for (const parser of parsers) {
      this.register(parser)
    }
  }

  register(parser: CLIParser): void {
    if (this.parsers.some((candidate) => candidate.name === parser.name)) {
      throw new Error(`Parser \"${parser.name}\" is already registered`)
    }

    this.parsers.push(parser)
  }

  get(name: string): CLIParser | undefined {
    return this.parsers.find((parser) => parser.name === name)
  }

  list(): CLIParser[] {
    return [...this.parsers]
  }

  select(helpText: string, forcedParserName?: string): CLIParser {
    if (forcedParserName) {
      const parser = this.get(forcedParserName)
      if (!parser) {
        throw new Error(`Unknown parser \"${forcedParserName}\"`)
      }

      return parser
    }

    const detected = this.parsers.find((parser) => parser.detect(helpText))
    if (detected) {
      return detected
    }

    const fallback = this.get('heuristic')
    if (!fallback) {
      throw new Error('No fallback parser registered')
    }

    return fallback
  }
}

export function createDefaultParserRegistry(): ParserRegistry {
  return new ParserRegistry([
    oclifParser,
    commanderParser,
    yargsParser,
    cobraParser,
    thorParser,
    picocliParser,
    urfaveCliParser,
    typerParser,
    clickParser,
    clapParser,
    argparseParser,
    heuristicParser,
  ])
}
