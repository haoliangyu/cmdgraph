import { execute } from '@oclif/core'
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
	siteBaseUrl?: string
	parserRegistry?: CrawlOptions['parserRegistry']
	executor?: CrawlOptions['executor']
	format?: OutputFormat | OutputFormat[]
	rootCommandName?: string
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
	if (formats.includes('sitemap') && !options.siteBaseUrl) {
		throw new Error('siteBaseUrl is required when generating sitemap output')
	}

	const outputTree = withRootCommandName(tree, options.rootCommandName)

	return {
		tree: outputTree,
		json: formats.includes('json') ? formatAsJson(outputTree) : undefined,
		markdown: formats.includes('md') ? formatAsMarkdown(outputTree) : undefined,
		html: formats.includes('html') ? formatAsHtml(outputTree) : undefined,
		llmsTxt: formats.includes('llms-txt') ? formatAsLlmsTxt(outputTree, { siteBaseUrl: options.siteBaseUrl }) : undefined,
		sitemap: formats.includes('sitemap') ? formatAsSitemap(outputTree, { siteBaseUrl: options.siteBaseUrl as string }) : undefined,
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
