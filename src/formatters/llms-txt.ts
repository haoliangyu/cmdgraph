import type { CommandNode } from '../types.js'
import { buildCommandAnchorUrl, buildSitePageUrl, countNodes, flattenTree, maxDepth } from './site.js'

export interface LlmsTxtOptions {
	siteBaseUrl?: string
}

export function formatAsLlmsTxt(root: CommandNode, options: LlmsTxtOptions = {}): string {
	const entries = flattenTree(root)
	const rootCommand = root.path.join(' ')
	const title = `${rootCommand} CLI Documentation`
	const description = root.description ?? `Structured CLI documentation for ${rootCommand}`
	const indexUrl = buildSitePageUrl(options.siteBaseUrl, 'index.html')

	const lines: string[] = [
		`# ${title}`,
		'',
		description,
		'',
		'## Overview',
		'',
		`- Primary HTML documentation: ${indexUrl}`,
		`- Root command: ${rootCommand}`,
		`- Command sections: ${countNodes(root)}`,
		`- Maximum command depth: ${maxDepth(root)}`,
		'',
		'## Commands',
		'',
	]

	for (const entry of entries) {
		const commandName = entry.node.path.join(' ')
		const anchorUrl = buildCommandAnchorUrl(options.siteBaseUrl, entry.id)
		lines.push(`- ${commandName}`)
		lines.push(`  URL: ${anchorUrl}`)

		if (entry.node.description) {
			lines.push(`  Summary: ${entry.node.description}`)
		}

		if (entry.node.usage) {
			lines.push(`  Usage: ${entry.node.usage}`)
		}

		if (entry.node.version) {
			lines.push(`  Version: ${entry.node.version}`)
		}

		if (entry.node.aliases.length > 0) {
			lines.push(`  Aliases: ${entry.node.aliases.join(', ')}`)
		}

		if (entry.node.subcommands.length > 0) {
			lines.push(`  Subcommands: ${entry.node.subcommands.join(', ')}`)
		}

		if (entry.node.options.length > 0) {
			lines.push(`  Options: ${entry.node.options.map((option) => option.flag).join(', ')}`)
		}

		lines.push('')
	}

	return `${lines.join('\n').trimEnd()}\n`
}