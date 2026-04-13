import { execute } from '@oclif/core'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { crawlCommandTree } from './core/crawler.js'
import type { CrawlOptions } from './core/crawler.js'
import { withRootCommandName } from './core/root-command-name.js'
import { normalizeFormats } from './formatters/formats.js'
import type { OutputFormat } from './formatters/formats.js'
import { formatAsHtml } from './formatters/html.js'
import { formatAsJson } from './formatters/json.js'
import { formatAsLlmsTxt } from './formatters/llms-txt.js'
import { formatAsMarkdown } from './formatters/markdown.js'
import { formatAsSitemap } from './formatters/sitemap.js'
import type { CommandNode } from './types.js'

export type { CommandNode, ParsedCommand, Option } from './types.js'
export type { CrawlOptions } from './core/crawler.js'
export type { OutputFormat } from './formatters/formats.js'

export interface GenerateOptions {
	'max-depth'?: number
	concurrency?: number
	timeout?: number
	parser?: string
	'output-root-command-name'?: string
	'output-html-title'?: string
	'output-html-project-link'?: string
	'output-html-readme'?: string
	'output-llms-txt-base-url'?: string
	'output-sitemap-base-url'?: string
	parserRegistry?: CrawlOptions['parserRegistry']
	executor?: CrawlOptions['executor']
	format?: OutputFormat | OutputFormat[]
}

export interface GeneratedDocumentation {
	tree: CommandNode
	json?: string
	markdown?: string
	html?: string
	llmsTxt?: string
	sitemap?: string
	warnings: string[]
}

export async function introspect(
	command: string,
	options: Omit<CrawlOptions, 'onWarning' | 'maxDepth' | 'timeoutMs'> & {
		maxDepth?: number
		timeoutMs?: number
	} = {},
): Promise<{ tree: CommandNode; warnings: string[] }> {
	const warnings: string[] = []
	const tree = await crawlCommandTree(command, {
		...options,
		maxDepth: options.maxDepth,
		timeoutMs: options.timeoutMs ?? 5000,
		onWarning: (message) => warnings.push(message),
	})

	return { tree, warnings }
}

export async function introspectCommand(
	command: string,
	options: Omit<CrawlOptions, 'onWarning' | 'maxDepth' | 'timeoutMs'> & {
		maxDepth?: number
		timeoutMs?: number
	} = {},
): Promise<{ tree: CommandNode; warnings: string[] }> {
	return introspect(command, options)
}

export async function generateDocumentation(
	command: string,
	options: GenerateOptions = {},
): Promise<GeneratedDocumentation> {
	const { tree, warnings } = await introspect(command, {
		concurrency: options.concurrency,
		maxDepth: options['max-depth'],
		timeoutMs: options.timeout,
		parserName: options.parser,
		parserRegistry: options.parserRegistry,
		executor: options.executor,
	})

	const formats = normalizeFormats(options.format)
	if (formats.includes('sitemap') && !options['output-sitemap-base-url']) {
		throw new Error('output-sitemap-base-url is required when generating sitemap output')
	}

	let htmlReadmeMarkdown: string | undefined
	if (options['output-html-readme']) {
		const readmePath = options['output-html-readme'].trim()
		if (!readmePath.toLowerCase().endsWith('.md')) {
			throw new Error('output-html-readme must point to a .md file')
		}

		htmlReadmeMarkdown = await readFile(resolve(readmePath), 'utf8')
	}

	const outputTree = withRootCommandName(tree, options['output-root-command-name'])

	return {
		tree: outputTree,
		json: formats.includes('json') ? formatAsJson(outputTree) : undefined,
		markdown: formats.includes('md') ? formatAsMarkdown(outputTree) : undefined,
		html: formats.includes('html')
			? formatAsHtml(outputTree, {
				title: options['output-html-title'],
				projectLink: options['output-html-project-link'],
				readme: htmlReadmeMarkdown,
			})
			: undefined,
		llmsTxt: formats.includes('llms-txt')
			? formatAsLlmsTxt(outputTree, { siteBaseUrl: options['output-llms-txt-base-url'] })
			: undefined,
		sitemap: formats.includes('sitemap')
			? formatAsSitemap(outputTree, { siteBaseUrl: options['output-sitemap-base-url'] as string })
			: undefined,
		warnings,
	}
}

export async function generate(command: string, options: GenerateOptions = {}): Promise<GeneratedDocumentation> {
	return generateDocumentation(command, options)
}

const isDirectExecution = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
	void execute({ dir: import.meta.url })
}
