import { Args, Command, Flags } from '@oclif/core'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { crawlCommandTree } from '../core/crawler.js'
import { formatAsJson } from '../formatters/json.js'
import { formatAsMarkdown } from '../formatters/markdown.js'

type OutputFormat = 'json' | 'md' | 'both'

function toSafeFileStem(command: string): string {
  return command.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
}

export default class GenerateCommand extends Command {
  static override description = 'Recursively introspect a CLI via --help and generate documentation'

  static override examples = ['<%= config.bin %> <%= command.id %> kubectl --max-depth=3 --output=./docs']

  static override args = {
    command: Args.string({
      description: 'Root command to introspect, e.g. git or kubectl',
      required: true,
    }),
  }

  static override flags = {
    'max-depth': Flags.integer({
      description: 'Limit recursion depth',
      min: 0,
      default: 2,
    }),
    format: Flags.string({
      description: 'Output format',
      options: ['json', 'md', 'both'],
      default: 'both',
    }),
    output: Flags.string({
      description: 'Output directory',
      default: './docs',
    }),
    timeout: Flags.integer({
      description: 'Per-command execution timeout in milliseconds',
      min: 100,
      default: 5000,
    }),
    parser: Flags.string({
      description: 'Force parser plugin name',
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateCommand)

    const format = flags.format as OutputFormat
    const outputDir = resolve(flags.output)

    await mkdir(outputDir, { recursive: true })

    const warnings: string[] = []
    const tree = await crawlCommandTree(args.command, {
      maxDepth: flags['max-depth'],
      timeoutMs: flags.timeout,
      parserName: flags.parser,
      onWarning: (message) => warnings.push(message),
    })

    const stem = toSafeFileStem(args.command)

    if (format === 'json' || format === 'both') {
      const jsonPath = resolve(outputDir, `${stem}.json`)
      await writeFile(jsonPath, formatAsJson(tree), 'utf8')
      this.log(`Wrote ${jsonPath}`)
    }

    if (format === 'md' || format === 'both') {
      const markdownPath = resolve(outputDir, `${stem}.md`)
      await writeFile(markdownPath, formatAsMarkdown(tree), 'utf8')
      this.log(`Wrote ${markdownPath}`)
    }

    for (const warning of warnings) {
      this.warn(warning)
    }
  }
}
