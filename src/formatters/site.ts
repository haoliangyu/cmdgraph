import type { CommandNode } from '../types.js'

export type CommandEntry = {
	node: CommandNode
	id: string
	depth: number
}

export function slugify(path: string[]): string {
	return path.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'command'
}

export function flattenTree(node: CommandNode, depth = 0): CommandEntry[] {
	const id = slugify(node.path)
	return [{ node, id, depth }, ...node.children.flatMap((child) => flattenTree(child, depth + 1))]
}

export function countNodes(node: CommandNode): number {
	return 1 + node.children.reduce((total, child) => total + countNodes(child), 0)
}

export function maxDepth(node: CommandNode): number {
	if (node.children.length === 0) {
		return node.path.length
	}

	return Math.max(node.path.length, ...node.children.map(maxDepth))
}

export function normalizeSiteBaseUrl(siteBaseUrl: string): string {
	return siteBaseUrl.endsWith('/') ? siteBaseUrl : `${siteBaseUrl}/`
}

export function buildSitePageUrl(siteBaseUrl: string | undefined, relativePath: string): string {
	if (!siteBaseUrl) {
		return relativePath
	}

	return new URL(relativePath, normalizeSiteBaseUrl(siteBaseUrl)).toString()
}

export function buildCommandAnchorUrl(siteBaseUrl: string | undefined, id: string): string {
	const pageUrl = buildSitePageUrl(siteBaseUrl, 'index.html')
	return `${pageUrl}#${id}`
}