export type OutputFormat = 'json' | 'md'

export function normalizeFormats(formats: OutputFormat | OutputFormat[] | undefined): OutputFormat[] {
	const selected: OutputFormat[] = formats === undefined ? ['json'] : Array.isArray(formats) ? formats : [formats]
	return [...new Set(selected)]
}