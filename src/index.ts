import { execute } from '@oclif/core'
import { pathToFileURL } from 'node:url'
import { crawlCommandTree } from './core/crawler.js'
import type { CrawlOptions } from './core/crawler.js'
import { formatAsJson } from './formatters/json.js'
import { formatAsMarkdown } from './formatters/markdown.js'
import type { CommandNode } from './types.js'

export type { CommandNode, ParsedCommand, Option } from './types.js'
export type { CrawlOptions } from './core/crawler.js'

export interface GenerateOptions {
	'max-depth'?: number
	concurrency?: number
	timeout?: number
	parser?: string
	parserRegistry?: CrawlOptions['parserRegistry']
	executor?: CrawlOptions['executor']
	format?: 'json' | 'md' | 'both'
}

export interface GeneratedDocumentation {
	tree: CommandNode
	json?: string
	markdown?: string
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
		maxDepth: options.maxDepth ?? 2,
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

	const format = options.format ?? 'both'
	return {
		tree,
		json: format === 'json' || format === 'both' ? formatAsJson(tree) : undefined,
		markdown: format === 'md' || format === 'both' ? formatAsMarkdown(tree) : undefined,
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
