# cmdgraph

[![CI](https://github.com/haoliangyu/cmdgraph/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/haoliangyu/cmdgraph/actions/workflows/ci.yml)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Recursive CLI documentation introspection for humans and AI agents.

`cmdgraph` runs CLI help commands (`--help`, `-h`, `-H`, or `help`), discovers subcommands recursively, parses the output into structured data, and exports documentation as JSON, Markdown, static HTML, `llms.txt`, and `sitemap.xml`.

## Why cmdgraph?

Most CLIs are documented in unstructured terminal text. `cmdgraph` turns that into:

- Machine-friendly JSON for indexing, retrieval, and agent pipelines
- Human-readable Markdown for generated docs and internal references
- Static single-page HTML for hosting CLI docs as a site
- Explicit `llms.txt` output for LLM-facing discovery
- Explicit `sitemap.xml` output for search-engine discovery
- A command tree (AST) that preserves hierarchy and relationships

## Features

- Recursive command discovery from `--help`, `-h`, `-H`, or `help`
- Plugin parser system (`heuristic`, `oclif`, `commander`, `yargs`, `cobra`, `click`, `typer`, `clap`, `argparse`)
- Best-effort metadata extraction for arguments, examples, and aliases
- Concurrency control for recursive help crawling
- Automatic in-memory caching of help outputs within a process
- Timeout-safe command execution using `execa`
- Non-interactive execution defaults (`CI=1`, `NO_COLOR=1`)
- JSON, Markdown, static HTML, `llms.txt`, and `sitemap.xml` output formats
- Searchable single-page HTML docs with client-side command filtering
- Search-engine and LLM-friendly discovery artifacts without coupling them to HTML output
- Unit + integration + e2e tests with deterministic fixtures

## Requirements

- Node.js `>=18`

## Installation

```bash
npm install -g cmdgraph
```

## CLI Usage

```bash
cmdgraph generate <command> [options]
```

Examples:

```bash
cmdgraph generate git --max-depth=2 --format=json --format=md --output=./docs
cmdgraph generate git --max-depth=2 --format=html --output=./site
cmdgraph generate git --max-depth=2 --format=html --format=llms-txt --format=sitemap --site-base-url=https://docs.example.com/git/ --root-command-name=cmdgraph --output=./site
cmdgraph generate git --max-depth=3 --concurrency=4 --format=json --output=./docs
cmdgraph generate kubectl --max-depth=3 --timeout=8000 --format=json --output=./docs
cmdgraph generate "node ./tools/my-cli.mjs" --parser=heuristic --format=md --output=./docs
```

### Crawler options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--max-depth` | integer | `2` | Maximum recursion depth for subcommands |
| `--concurrency` | integer | `4` | Maximum number of help commands to run in parallel |
| `--timeout` | integer | `5000` | Per-command timeout in ms |
| `--parser` | string | auto-detect | Force a parser plugin by name |

### Output options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--format` | repeatable `json \| md \| html \| llms-txt \| sitemap` | `json` | Output format; repeat the flag to write multiple outputs |
| `--output` | string | `./docs` | Output directory |
| `--site-base-url` | string | unset | Base URL used to generate discovery artifacts such as `llms.txt` links and `sitemap.xml` |
| `--root-command-name` | string | unset | Override the displayed root command name in generated outputs |

## Library Usage

`cmdgraph` can also be used as a library:

```ts
import { generate, introspect } from 'cmdgraph'

const { tree, warnings } = await introspect('git', {
	maxDepth: 2,
	timeoutMs: 5000,
	concurrency: 4,
})

const generated = await generate('git', {
	'max-depth': 2,
	timeout: 5000,
	concurrency: 4,
	parser: 'heuristic',
	rootCommandName: 'cmdgraph',
	siteBaseUrl: 'https://docs.example.com/git/',
	format: ['json', 'md', 'html', 'llms-txt', 'sitemap'],
})

console.log(generated.json)
console.log(generated.markdown)
console.log(generated.html)
console.log(generated.llmsTxt)
console.log(generated.sitemap)
```

Library API notes:

- `introspect(command, options)` returns `{ tree, warnings }`
- `generate(command, options)` returns `{ tree, json?, markdown?, html?, llmsTxt?, sitemap?, warnings }`
- `options.format` supports `json`, `md`, `html`, `llms-txt`, and `sitemap`; pass an array for multiple outputs, and omit it to default to JSON
- `options.siteBaseUrl` is required for `sitemap` and is recommended for `llms-txt`
- `options.rootCommandName` overrides the displayed root command name in generated outputs
- `generate` options align with CLI flag names: `max-depth`, `timeout`, `concurrency`, `parser`, `format`, `siteBaseUrl`, and `rootCommandName`
- advanced injection (`executor`, `parserRegistry`) is available for tests/custom integration

## Supported Parsers

`cmdgraph` uses a plugin-based parser registry. You can force one with `--parser`, or let `cmdgraph` auto-detect.

- `heuristic`: default and fallback parser; handles common help layouts (`Usage`, `Commands`, `Options`/`Flags`); recommended for most tools.
- `oclif`: parser for oclif-style CLIs (supports uppercase section blocks such as `USAGE`, `COMMANDS`, `FLAGS`).
- `commander`: parser for Commander.js-style output (`display help for command`, `output the version number`).
- `yargs`: parser for yargs-style output (`Show help`, `Show version number`, type hints like `[boolean]`).
- `cobra`: parser for Cobra-style CLIs (`Available Commands`, `Flags`, `Global Flags`).
- `click`: parser for Click-style output (`[OPTIONS]`, `Show this message and exit`).
- `typer`: parser for Typer-style output (Click-based plus completion flags and boxed sections).
- `clap`: parser for clap-style output (`Print help`, `Print version`).
- `argparse`: parser for Python argparse-style output (`usage:`, `show this help message and exit`).

Parser selection behavior:

1. If `--parser` is provided, that parser is used.
2. Otherwise, parser `detect()` methods are checked.
3. If nothing matches, `heuristic` is used.

## Output

For `cmdgraph generate git --format=json --format=md --format=html --format=llms-txt --format=sitemap --site-base-url=https://docs.example.com/git/ --output=./docs`, you get:

- `docs/git.json`
- `docs/git.md`
- `docs/index.html`
- `docs/llms.txt`
- `docs/sitemap.xml`

Why these formats:

- JSON is agent-ready because it is structured, stable, and easy to index, diff, validate, and consume in automation pipelines.
- Markdown is human-readable because it is hierarchy-first, scannable in docs/reviews, and works well in repos, wikis, and generated documentation sites.
- HTML is hosting-ready because it renders the canonical command tree into a single accessible page with dark mode support and navigation for static-site deployment.
- `llms.txt` is explicit because it gives LLM crawlers a compact text map of the hosted documentation without embedding that responsibility into the HTML page itself.
- `sitemap.xml` is explicit because search-engine discovery depends on deployable site URLs, not just local output files.

JSON shape:

```json
{
	"name": "git",
	"description": "The stupid content tracker",
	"usage": "git [options] [command]",
	"aliases": [],
	"arguments": [],
	"examples": [],
	"options": [
		{ "flag": "-h, --help", "description": "display help" }
	],
	"subcommands": ["add", "commit", "push"],
	"path": ["git"],
	"children": []
}
```

Matching Markdown output:

```md
# Command Documentation

## git
The stupid content tracker

**Usage:** `git [options] [command]`

**Options**
- `-h, --help`: display help

**Subcommands**
- `add`
- `commit`
- `push`
```

HTML output characteristics:

- generated as a single `index.html` file for static hosting
- rendered from a React template via server-side rendering
- styled with Tailwind CSS and shadcn/ui-inspired component patterns
- modern light-green theme by default, with an accessible dark mode toggle
- includes client-side command filtering for large documentation pages
- includes crawlable semantic content, metadata, and structured data for search engines and LLM bots

Discovery artifact characteristics:

- `llms.txt` is generated separately and lists the hosted documentation page plus command-level anchors
- `sitemap.xml` is generated separately and requires `--site-base-url` so it contains valid deployable URLs
- HTML output does not implicitly generate either file; request them explicitly with `--format=llms-txt` and `--format=sitemap`

## Agent Reference Guide (Packaged JSON)

`npm run build:docs:release` now generates a JSON reference guide and places it inside the published package payload:

- `dist/agent-reference/cmdgraph.json` (stable path for agents)

How to use it in an agent/tooling workflow:

1. Install the package.
2. Read `dist/agent-reference/cmdgraph.json` from the installed package directory.
3. Use the command tree, options, and examples as the source of truth when generating or validating `cmdgraph` usage.

Notes:

- The file is generated from live introspection of the built CLI.
- It is rebuilt on package release.

## Testing

Run default tests (build + unit/integration):

```bash
npm test
```

Run real CLI e2e tests:

```bash
npm run test:e2e
```

Watch mode:

```bash
npm run test:watch
```

Current test coverage includes:

- Executor behavior (success + timeout)
- Heuristic parser with common and real-world fixtures (`git`, `docker`, `kubectl`, `gh` styles)
- Framework parser detection and parsing fixtures (`oclif`, `commander`, `yargs`, `cobra`, `click`, `typer`, `clap`, `argparse`)
- Metadata extraction for aliases, arguments, and examples
- Library API tests for programmatic introspection and formatted output generation
- HTML formatter rendering and static site generation
- Explicit `llms.txt` and `sitemap.xml` generation and validation
- Integration crawling against a real fixture executable
- End-to-end generation through built CLI, with auto-skip when target CLIs are unavailable

## Development

```bash
npm install
npm run build
npm run lint
npm test
npm run test:e2e
```

Format code:

```bash
npm run format
```

## License

MIT
