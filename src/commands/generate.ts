import { Args, Command, Flags } from '@oclif/core'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { crawlCommandTree } from '../core/crawler.js'
import { withRootCommandName } from '../core/root-command-name.js'
import { normalizeFormats } from '../formatters/formats.js'
import type { OutputFormat } from '../formatters/formats.js'
import { formatAsHtml } from '../formatters/html.js'
import { formatAsJson } from '../formatters/json.js'
import { formatAsLlmsTxt } from '../formatters/llms-txt.js'
import { formatAsMarkdown } from '../formatters/markdown.js'
import { formatAsSitemap } from '../formatters/sitemap.js'
import {
  DEFAULT_CONFIG_FILE_PATH,
  DEFAULT_GENERATE_FLAGS,
  getProvidedLongFlagNames,
  loadGenerateConfigFlags,
  pickCliGenerateOverrides,
  type GenerateResolvedFlags,
} from '../core/generate-config.js'

function toSafeFileStem(command: string): string {
  return command.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
}

export default class GenerateCommand extends Command {
  static override description = 'Recursively introspect a CLI via --help and generate documentation'

  static override examples = ['<%= config.bin %> <%= command.id %> kubectl --output=./docs']

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
      helpGroup: 'Crawler options',
    }),
    format: Flags.string({
      description: 'Output format; repeat the flag to write multiple outputs',
      options: ['json', 'md', 'html', 'llms-txt', 'sitemap'],
      multiple: true,
      default: ['json'],
      helpGroup: 'Output options (general)',
    }),
    output: Flags.string({
      description: 'Output directory',
      default: './docs',
      helpGroup: 'Output options (general)',
    }),
    timeout: Flags.integer({
      description: 'Per-command execution timeout in milliseconds',
      min: 100,
      default: 5000,
      helpGroup: 'Crawler options',
    }),
    concurrency: Flags.integer({
      description: 'Maximum number of help commands to run in parallel',
      min: 1,
      default: 4,
      helpGroup: 'Crawler options',
    }),
    parser: Flags.string({
      description: 'Force parser plugin name',
      helpGroup: 'Crawler options',
    }),
    config: Flags.string({
      description: 'Path to a JSON config file',
      default: DEFAULT_CONFIG_FILE_PATH,
      helpGroup: 'Configuration options',
    }),
    'output-root-command-name': Flags.string({
      description: 'Override displayed root command name in generated outputs',
      helpGroup: 'Output options (general)',
    }),
    'output-html-title': Flags.string({
      description: 'Custom HTML page title',
      helpGroup: 'Output options (html)',
    }),
    'output-html-project-link': Flags.string({
      description: 'Project URL shown in the HTML footer',
      helpGroup: 'Output options (html)',
    }),
    'output-html-readme': Flags.string({
      description: 'Path to a .md file rendered as a README section in the HTML page',
      helpGroup: 'Output options (html)',
    }),
    'output-llms-txt-base-url': Flags.string({
      description: 'Base site URL used for llms.txt links',
      helpGroup: 'Output options (llms-txt)',
    }),
    'output-sitemap-base-url': Flags.string({
      description: 'Base site URL used for sitemap.xml links',
      helpGroup: 'Output options (sitemap)',
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateCommand)
    const providedLongFlags = getProvidedLongFlagNames(this.argv)
    const configFlags = await loadGenerateConfigFlags(flags.config, {
      required: providedLongFlags.has('config'),
    })

    const cliOverrides = pickCliGenerateOverrides(flags as GenerateResolvedFlags, providedLongFlags)
    const resolvedFlags: GenerateResolvedFlags = {
      ...DEFAULT_GENERATE_FLAGS,
      ...configFlags,
      ...cliOverrides,
    }

    const formats = normalizeFormats(resolvedFlags.format as OutputFormat[] | undefined)
    if (formats.includes('sitemap') && !resolvedFlags['output-sitemap-base-url']) {
      this.error('--output-sitemap-base-url is required when using --format=sitemap')
  	}

    const outputDir = resolve(resolvedFlags.output as string)

    await mkdir(outputDir, { recursive: true })

    const warnings: string[] = []
    const timeoutMs = resolvedFlags.timeout ?? 5000
    const tree = await crawlCommandTree(args.command, {
      concurrency: resolvedFlags.concurrency,
      maxDepth: resolvedFlags['max-depth'],
      timeoutMs,
      parserName: resolvedFlags.parser,
      onWarning: (message) => warnings.push(message),
    })

    const outputTree = withRootCommandName(tree, resolvedFlags['output-root-command-name'])
    let htmlReadmeMarkdown: string | undefined

    if (resolvedFlags['output-html-readme']) {
      const readmePath = resolvedFlags['output-html-readme'].trim()
      if (!readmePath.toLowerCase().endsWith('.md')) {
        this.error('--output-html-readme must point to a .md file')
      }

      try {
        htmlReadmeMarkdown = await readFile(resolve(readmePath), 'utf8')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        this.error(`Failed to read --output-html-readme file: ${message}`)
      }
    }

    const stem = toSafeFileStem(args.command)

    if (formats.includes('json')) {
      const jsonPath = resolve(outputDir, `${stem}.json`)
      await writeFile(jsonPath, formatAsJson(outputTree), 'utf8')
      this.log(`Wrote ${jsonPath}`)
    }

    if (formats.includes('md')) {
      const markdownPath = resolve(outputDir, `${stem}.md`)
      await writeFile(markdownPath, formatAsMarkdown(outputTree), 'utf8')
      this.log(`Wrote ${markdownPath}`)
    }

    if (formats.includes('html')) {
      const htmlPath = resolve(outputDir, 'index.html')
      await writeFile(
        htmlPath,
        formatAsHtml(outputTree, {
          title: resolvedFlags['output-html-title'],
          projectLink: resolvedFlags['output-html-project-link'],
          readme: htmlReadmeMarkdown,
        }),
        'utf8',
      )
      this.log(`Wrote ${htmlPath}`)
    }

    if (formats.includes('llms-txt')) {
      const llmsTxtPath = resolve(outputDir, 'llms.txt')
      await writeFile(llmsTxtPath, formatAsLlmsTxt(outputTree, { siteBaseUrl: resolvedFlags['output-llms-txt-base-url'] }), 'utf8')
      this.log(`Wrote ${llmsTxtPath}`)
    }

    if (formats.includes('sitemap')) {
      const sitemapPath = resolve(outputDir, 'sitemap.xml')
      await writeFile(sitemapPath, formatAsSitemap(outputTree, { siteBaseUrl: resolvedFlags['output-sitemap-base-url'] as string }), 'utf8')
      this.log(`Wrote ${sitemapPath}`)
    }

    for (const warning of warnings) {
      this.warn(warning)
    }
  }
}
