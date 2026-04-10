import type { CommandNode } from '../types.js'
import { buildSitePageUrl } from './site.js'

export interface SitemapOptions {
	siteBaseUrl: string
}

function escapeXml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function formatAsSitemap(_root: CommandNode, options: SitemapOptions): string {
	const pageUrl = buildSitePageUrl(options.siteBaseUrl, 'index.html')
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		`  <url><loc>${escapeXml(pageUrl)}</loc></url>`,
		'</urlset>',
		'',
	].join('\n')
}