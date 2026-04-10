import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cva } from 'class-variance-authority'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CommandNode } from '../types.js'
import { countNodes, flattenTree, maxDepth, slugify } from './site.js'

function cn(...inputs: Array<string | false | null | undefined>): string {
	return twMerge(clsx(inputs))
}

const badgeVariants = cva(
	'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
	{
		variants: {
			variant: {
				default: 'border-primary/25 bg-primary/10 text-primary',
				secondary: 'border-border bg-muted text-muted-foreground',
				outline: 'border-border bg-background text-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

const cardClass =
	'rounded-3xl border border-border/70 bg-card/90 shadow-[0_24px_80px_-40px_rgba(16,24,40,0.45)] backdrop-blur supports-[backdrop-filter]:bg-card/80'

type SummaryItem = {
	label: string
	value: string
}

type CommandEntry = {
	node: CommandNode
	id: string
	depth: number
}

type SearchDocument = {
	title: string
	description: string
	commandCount: number
	entries: Array<{
		name: string
		id: string
		depth: number
		description: string
		usage: string
		aliases: string[]
		arguments: string[]
		examples: string[]
		options: string[]
		subcommands: string[]
	}>
}

function escapeJsonForScript(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

function buildSearchDocument(root: CommandNode, entries: CommandEntry[], description: string): SearchDocument {
	return {
		title: `${root.path.join(' ')} CLI Documentation`,
		description,
		commandCount: entries.length,
		entries: entries.map((entry) => ({
			name: entry.node.path.join(' '),
			id: entry.id,
			depth: entry.depth,
			description: entry.node.description ?? '',
			usage: entry.node.usage ?? '',
			aliases: entry.node.aliases,
			arguments: entry.node.arguments,
			examples: entry.node.examples,
			options: entry.node.options.map((option) => `${option.flag} ${option.description}`.trim()),
			subcommands: entry.node.subcommands,
		})),
	}
}

function buildStructuredData(root: CommandNode, entries: CommandEntry[], title: string, description: string): Array<Record<string, unknown>> {
	const rootName = root.path.join(' ')
	return [
		{
			'@context': 'https://schema.org',
			'@type': 'TechArticle',
			headline: title,
			description,
			about: rootName,
			keywords: ['CLI documentation', 'command reference', rootName],
			articleSection: entries.map((entry) => entry.node.path.join(' ')),
		},
		{
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: `${rootName} command index`,
			numberOfItems: entries.length,
			itemListElement: entries.map((entry, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: entry.node.path.join(' '),
				url: `#${entry.id}`,
			})),
		},
	]
}

function StatCard({ label, value }: SummaryItem): React.JSX.Element {
	return (
		<div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
			<div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
			<div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
		</div>
	)
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
	return <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{children}</h3>
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline' }): React.JSX.Element {
	return <span className={badgeVariants({ variant })}>{children}</span>
}

function CommandSection({ entry }: { entry: CommandEntry }): React.JSX.Element {
	const { node, id, depth } = entry
	const headingLevel = Math.min(depth + 2, 6) as 2 | 3 | 4 | 5 | 6
	const HeadingTag = `h${headingLevel}` as keyof React.JSX.IntrinsicElements

	return (
		<section id={id} aria-labelledby={`${id}-heading`} className={cn(cardClass, 'scroll-mt-24 px-6 py-6 md:px-8 md:py-8')}>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-3">
					<Badge variant="secondary">{node.path.join(' ')}</Badge>
					<HeadingTag id={`${id}-heading`} className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						{node.path.join(' ')}
					</HeadingTag>
					{node.description ? <p className="max-w-3xl text-base leading-7 text-muted-foreground">{node.description}</p> : null}
				</div>
				<div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
					{node.aliases.length > 0 ? <Badge variant="outline">{node.aliases.length} alias{node.aliases.length === 1 ? '' : 'es'}</Badge> : null}
					{node.options.length > 0 ? <Badge variant="outline">{node.options.length} option{node.options.length === 1 ? '' : 's'}</Badge> : null}
					{node.children.length > 0 ? <Badge variant="outline">{node.children.length} child command{node.children.length === 1 ? '' : 's'}</Badge> : null}
				</div>
			</div>

			<div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
				<div className="space-y-6">
					{node.usage ? (
						<div className="space-y-3">
							<SectionTitle>Usage</SectionTitle>
							<pre className="overflow-x-auto rounded-2xl border border-border/70 bg-emerald-950/95 px-4 py-4 text-sm leading-6 text-emerald-50">
								<code>{node.usage}</code>
							</pre>
						</div>
					) : null}

					{node.examples.length > 0 ? (
						<div className="space-y-3">
							<SectionTitle>Examples</SectionTitle>
							<div className="space-y-3">
								{node.examples.map((example) => (
									<pre key={example} className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/60 px-4 py-4 text-sm leading-6 text-foreground">
										<code>{example}</code>
									</pre>
								))}
							</div>
						</div>
					) : null}

					{node.options.length > 0 ? (
						<div className="space-y-3">
							<SectionTitle>Options</SectionTitle>
							<ul className="grid gap-3">
								{node.options.map((option) => (
									<li key={`${node.path.join(' ')}-${option.flag}`} className="rounded-2xl border border-border/70 bg-background/70 p-4">
										<div className="font-mono text-sm font-medium text-foreground">{option.flag}</div>
										<p className="mt-2 text-sm leading-6 text-muted-foreground">{option.description || 'No description provided.'}</p>
									</li>
								))}
							</ul>
						</div>
					) : null}
				</div>

				<div className="space-y-6">
					{node.arguments.length > 0 ? (
						<div className="rounded-2xl border border-border/70 bg-background/70 p-5">
							<SectionTitle>Arguments</SectionTitle>
							<ul className="mt-4 space-y-2 text-sm leading-6 text-foreground">
								{node.arguments.map((argument) => (
									<li key={`${node.path.join(' ')}-${argument}`} className="font-mono">
										{argument}
									</li>
								))}
							</ul>
						</div>
					) : null}

					{node.aliases.length > 0 ? (
						<div className="rounded-2xl border border-border/70 bg-background/70 p-5">
							<SectionTitle>Aliases</SectionTitle>
							<div className="mt-4 flex flex-wrap gap-2">
								{node.aliases.map((alias) => (
									<Badge key={`${node.path.join(' ')}-${alias}`} variant="outline">
										{alias}
									</Badge>
								))}
							</div>
						</div>
					) : null}

					{node.subcommands.length > 0 ? (
						<div className="rounded-2xl border border-border/70 bg-background/70 p-5">
							<SectionTitle>Subcommands</SectionTitle>
							<ul className="mt-4 space-y-2 text-sm leading-6 text-foreground">
								{node.subcommands.map((subcommand) => (
									<li key={`${node.path.join(' ')}-${subcommand}`}>{subcommand}</li>
								))}
							</ul>
						</div>
					) : null}
				</div>
			</div>
		</section>
	)
}

function HtmlDocument({ root }: { root: CommandNode }): React.JSX.Element {
	const commandEntries = flattenTree(root)
	const summary: SummaryItem[] = [
		{ label: 'Commands', value: String(commandEntries.length) },
		{ label: 'Options', value: String(commandEntries.reduce((total, entry) => total + entry.node.options.length, 0)) },
		{ label: 'Depth', value: String(maxDepth(root)) },
	]

	const title = `${root.path.join(' ')} CLI Documentation`
	const description = root.description ?? `Static CLI documentation for ${root.path.join(' ')}`
	const searchDocument = buildSearchDocument(root, commandEntries, description)
	const structuredData = buildStructuredData(root, commandEntries, title, description)

	return (
		<html lang="en" className="scroll-smooth">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>{title}</title>
				<meta name="description" content={description} />
				<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
				<meta name="generator" content="doclix" />
				<meta name="color-scheme" content="light dark" />
				<meta property="og:type" content="article" />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:site_name" content="doclix" />
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={title} />
				<meta name="twitter:description" content={description} />
				<script src="https://cdn.tailwindcss.com?plugins=typography"></script>
				<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonForScript(structuredData) }} />
				<script type="application/json" id="doclix-search-index" dangerouslySetInnerHTML={{ __html: escapeJsonForScript(searchDocument) }} />
				<script
					dangerouslySetInnerHTML={{
						__html: `tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
        }
      },
      boxShadow: {
        glow: '0 24px 80px -32px rgba(16, 185, 129, 0.28)'
      }
    }
  }
};`,
					}}
				/>
				<style>{`
:root {
  color-scheme: light;
  --background: 138 43% 98%;
  --foreground: 160 24% 14%;
  --card: 0 0% 100%;
  --card-foreground: 160 24% 14%;
  --primary: 151 55% 43%;
  --primary-foreground: 0 0% 100%;
  --secondary: 140 34% 92%;
  --secondary-foreground: 160 24% 18%;
  --muted: 138 27% 94%;
  --muted-foreground: 160 14% 35%;
  --accent: 152 43% 88%;
  --accent-foreground: 160 24% 18%;
  --border: 150 24% 84%;
  --input: 150 24% 84%;
  --ring: 151 55% 43%;
}

.dark {
  color-scheme: dark;
  --background: 158 28% 9%;
  --foreground: 140 20% 92%;
  --card: 160 24% 11%;
  --card-foreground: 140 20% 92%;
  --primary: 148 48% 55%;
  --primary-foreground: 156 40% 10%;
  --secondary: 158 22% 16%;
  --secondary-foreground: 140 20% 92%;
  --muted: 158 18% 15%;
  --muted-foreground: 148 12% 70%;
  --accent: 160 26% 20%;
  --accent-foreground: 140 20% 92%;
  --border: 156 18% 22%;
  --input: 156 18% 22%;
  --ring: 148 48% 55%;
}

.sr-search-status {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

body {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.focus-ring:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
`}</style>
			</head>
			<body className="min-h-screen bg-background text-foreground antialiased">
				<a href="#main-content" className="focus-ring sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
					Skip to content
				</a>
				<div className="relative isolate overflow-hidden">
					<div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.24),_transparent_58%)]" />
					<div className="absolute right-0 top-24 -z-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
					<header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
						<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">doclix HTML export</p>
								<h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
							</div>
							<button
								id="theme-toggle"
								type="button"
								className="focus-ring inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm transition hover:border-primary/50 hover:text-primary"
								aria-pressed="false"
								aria-label="Toggle dark mode"
							>
								<span aria-hidden="true">◐</span>
								<span id="theme-toggle-label">Dark mode</span>
							</button>
						</div>
					</header>

					<div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-8 lg:py-14">
						<aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
							<div className={cn(cardClass, 'p-6 shadow-glow')}>
								<Badge>{root.path.join(' ')}</Badge>
								<p className="mt-4 text-lg font-semibold tracking-tight text-foreground">Human-readable static CLI docs</p>
								<p className="mt-3 text-sm leading-6 text-muted-foreground">Static site output generated from the canonical JSON command tree. Ready to host as a single page.</p>
								<div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
									{summary.map((item) => (
										<StatCard key={item.label} label={item.label} value={item.value} />
									))}
								</div>
							</div>

							<div className={cn(cardClass, 'p-4')}>
								<label htmlFor="command-search" className="px-3 pb-2 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
									Search commands
								</label>
								<div className="px-3">
									<input
										id="command-search"
										type="search"
										placeholder="Filter by command, option, alias, or usage"
										autoComplete="off"
										spellCheck={false}
										className="focus-ring w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
										aria-describedby="command-search-help command-search-status"
									/>
									<p id="command-search-help" className="mt-3 text-sm leading-6 text-muted-foreground">
										Live filter for command sections and the page index. Search works client-side; the full content remains present in the static HTML for crawlers.
									</p>
									<p id="command-search-status" role="status" aria-live="polite" className="sr-search-status">
										Showing all commands.
									</p>
								</div>
							</div>

							<nav aria-label="Command navigation" className={cn(cardClass, 'p-4')}>
								<p className="px-3 pb-3 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">On this page</p>
								<ul className="space-y-1" data-command-nav-list="true">
									{commandEntries.map((entry) => (
										<li key={entry.id} data-command-nav-item="true" data-command-id={entry.id} data-command-search={entry.node.path.join(' ').toLowerCase()}>
											<a
												href={`#${entry.id}`}
												className="focus-ring flex rounded-2xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
												style={{ paddingLeft: `${0.75 + entry.depth * 0.85}rem` }}
											>
												<span className="truncate">{entry.node.path.join(' ')}</span>
											</a>
										</li>
									))}
								</ul>
							</nav>
						</aside>

						<main id="main-content" className="space-y-8">
							<section className={cn(cardClass, 'p-6 md:p-8')}>
								<div className="flex flex-wrap items-center gap-3">
									<Badge>Source of truth: JSON</Badge>
									<Badge variant="secondary">Renderer: HTML</Badge>
									<Badge variant="outline">Accessible</Badge>
								</div>
								<h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Overview</h2>
								<p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
								<div className="mt-6 grid gap-4 md:grid-cols-2">
									<div className="rounded-2xl border border-border/70 bg-background/70 p-5">
										<SectionTitle>Root command</SectionTitle>
										<p className="mt-3 font-mono text-sm text-foreground">{root.path.join(' ')}</p>
									</div>
									<div className="rounded-2xl border border-border/70 bg-background/70 p-5">
										<SectionTitle>Generated structure</SectionTitle>
										<p className="mt-3 text-sm leading-6 text-muted-foreground">{countNodes(root)} command sections rendered into one static page for documentation hosting.</p>
									</div>
								</div>
							</section>

							{commandEntries.map((entry) => (
								<CommandSection key={entry.id} entry={entry} />
							))}
						</main>
					</div>
				</div>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function () {
  const root = document.documentElement;
  const storageKey = 'doclix-theme';
  const toggle = document.getElementById('theme-toggle');
  const label = document.getElementById('theme-toggle-label');
	const searchInput = document.getElementById('command-search');
	const searchStatus = document.getElementById('command-search-status');
	const navItems = Array.from(document.querySelectorAll('[data-command-nav-item="true"]'));
	const sections = Array.from(document.querySelectorAll('section[id][aria-labelledby]'));
	const searchIndexNode = document.getElementById('doclix-search-index');
	const searchIndex = searchIndexNode ? JSON.parse(searchIndexNode.textContent || '{}') : { entries: [], commandCount: 0 };

  function getPreferredTheme() {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.classList.toggle('dark', theme === 'dark');
    if (toggle) toggle.setAttribute('aria-pressed', String(theme === 'dark'));
    if (label) label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  }

  let theme = getPreferredTheme();
  applyTheme(theme);

  if (toggle) {
    toggle.addEventListener('click', function () {
      theme = root.classList.contains('dark') ? 'light' : 'dark';
      window.localStorage.setItem(storageKey, theme);
      applyTheme(theme);
    });
  }

	function normalize(value) {
		return String(value || '').toLowerCase().trim();
	}

	function buildNeedle(entry) {
		return normalize([
			entry.name,
			entry.description,
			entry.usage,
			entry.aliases.join(' '),
			entry.arguments.join(' '),
			entry.examples.join(' '),
			entry.options.join(' '),
			entry.subcommands.join(' ')
		].join(' '));
	}

	function applySearch(query) {
		const normalizedQuery = normalize(query);
		const entries = Array.isArray(searchIndex.entries) ? searchIndex.entries : [];
		let visibleCount = 0;

		entries.forEach(function (entry) {
			const matches = normalizedQuery.length === 0 || buildNeedle(entry).includes(normalizedQuery);
			const section = document.getElementById(entry.id);
			const navItem = document.querySelector('[data-command-nav-item="true"][data-command-id="' + entry.id + '"]');

			if (section) section.hidden = !matches;
			if (navItem) navItem.hidden = !matches;
			if (matches) visibleCount += 1;
		});

		if (searchStatus) {
			if (normalizedQuery.length === 0) {
				searchStatus.textContent = 'Showing all commands.';
			} else if (visibleCount === 0) {
				searchStatus.textContent = 'No commands match the current search.';
			} else {
				searchStatus.textContent = 'Showing ' + visibleCount + ' matching command' + (visibleCount === 1 ? '' : 's') + '.';
			}
		}
	}

	if (searchInput) {
		searchInput.addEventListener('input', function (event) {
			applySearch(event.target && event.target.value ? event.target.value : '');
		});
	}

	applySearch('');
})();`,
					}}
				/>
			</body>
		</html>
	)
}

export function formatAsHtml(root: CommandNode): string {
	return `<!DOCTYPE html>${renderToStaticMarkup(<HtmlDocument root={root} />)}\n`
}