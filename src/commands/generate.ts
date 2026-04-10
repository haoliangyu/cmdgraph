import { Args, Command, Flags } from '@oclif/core'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { crawlCommandTree } from '../core/crawler.js'
import { normalizeFormats } from '../formatters/formats.js'
import type { OutputFormat } from '../formatters/formats.js'
import { formatAsHtml } from '../formatters/html.js'
import { formatAsJson } from '../formatters/json.js'
import { formatAsLlmsTxt } from '../formatters/llms-txt.js'
import { formatAsMarkdown } from '../formatters/markdown.js'
import { formatAsSitemap } from '../formatters/sitemap.js'

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
      description: 'Output format; repeat the flag to write multiple outputs',
      options: ['json', 'md', 'html', 'llms-txt', 'sitemap'],
      multiple: true,
      default: ['json'],
    }),
    'site-base-url': Flags.string({
      description: 'Base site URL used for discovery artifacts such as sitemap and llms.txt links',
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
    concurrency: Flags.integer({
      description: 'Maximum number of help commands to run in parallel',
      min: 1,
      default: 4,
    }),
    parser: Flags.string({
      description: 'Force parser plugin name',
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateCommand)

    const formats = normalizeFormats(flags.format as OutputFormat[] | undefined)
  	if (formats.includes('sitemap') && !flags['site-base-url']) {
  		this.error('--site-base-url is required when using --format=sitemap')
  	}

    const outputDir = resolve(flags.output)

    await mkdir(outputDir, { recursive: true })

    const warnings: string[] = []
    const tree = await crawlCommandTree(args.command, {
      concurrency: flags.concurrency,
      maxDepth: flags['max-depth'],
      timeoutMs: flags.timeout,
      parserName: flags.parser,
      onWarning: (message) => warnings.push(message),
    })

    const stem = toSafeFileStem(args.command)

    if (formats.includes('json')) {
      const jsonPath = resolve(outputDir, `${stem}.json`)
      await writeFile(jsonPath, formatAsJson(tree), 'utf8')
      this.log(`Wrote ${jsonPath}`)
    }

    if (formats.includes('md')) {
      const markdownPath = resolve(outputDir, `${stem}.md`)
      await writeFile(markdownPath, formatAsMarkdown(tree), 'utf8')
      this.log(`Wrote ${markdownPath}`)
    }

    if (formats.includes('html')) {
      const htmlPath = resolve(outputDir, 'index.html')
      await writeFile(htmlPath, formatAsHtml(tree), 'utf8')
      this.log(`Wrote ${htmlPath}`)
    }

    if (formats.includes('llms-txt')) {
      const llmsTxtPath = resolve(outputDir, 'llms.txt')
      await writeFile(llmsTxtPath, formatAsLlmsTxt(tree, { siteBaseUrl: flags['site-base-url'] }), 'utf8')
      this.log(`Wrote ${llmsTxtPath}`)
    }

    if (formats.includes('sitemap')) {
      const sitemapPath = resolve(outputDir, 'sitemap.xml')
      await writeFile(sitemapPath, formatAsSitemap(tree, { siteBaseUrl: flags['site-base-url'] as string }), 'utf8')
      this.log(`Wrote ${sitemapPath}`)
    }

    for (const warning of warnings) {
      this.warn(warning)
    }
  }
}
