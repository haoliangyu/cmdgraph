# doclix

[![CI](https://github.com/haoliangyu/doclix/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/haoliangyu/doclix/actions/workflows/ci.yml)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Recursive CLI documentation introspection for humans and AI agents.

`doclix` runs CLI help commands (`--help`, `-h`, `-H`, or `help`), discovers subcommands recursively, parses the output into structured data, and exports documentation as JSON and Markdown.

## Why doclix?

Most CLIs are documented in unstructured terminal text. `doclix` turns that into:

- Machine-friendly JSON for indexing, retrieval, and agent pipelines
- Human-readable Markdown for generated docs and internal references
- A command tree (AST) that preserves hierarchy and relationships

## Features

- Recursive command discovery from `--help`, `-h`, `-H`, or `help`
- Plugin parser system (`heuristic`, `oclif`, `commander`, `yargs`, `cobra`, `click`, `typer`, `clap`, `argparse`)
- Best-effort metadata extraction for arguments, examples, and aliases
- Concurrency control for recursive help crawling
- Automatic in-memory caching of help outputs within a process
- Timeout-safe command execution using `execa`
- Non-interactive execution defaults (`CI=1`, `NO_COLOR=1`)
- JSON and Markdown output formats
- Unit + integration + e2e tests with deterministic fixtures

## Requirements

- Node.js `>=18`
- npm

## Installation

```bash
npm install
npm run build
```

Run locally:

```bash
node ./dist/index.js generate git --max-depth=2 --output=./docs
```

Optional local binary link:

```bash
npm link
doclix generate kubectl --max-depth=3 --output=./docs
```

## CLI Usage

```bash
doclix generate <command> [options]
```

Examples:

```bash
doclix generate git --max-depth=2 --format=json --format=md --output=./docs
doclix generate git --max-depth=3 --concurrency=4 --format=json --output=./docs
doclix generate kubectl --max-depth=3 --timeout=8000 --format=json --output=./docs
doclix generate "node ./tools/my-cli.mjs" --parser=heuristic --format=md --output=./docs
```

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--max-depth` | integer | `2` | Maximum recursion depth for subcommands |
| `--concurrency` | integer | `4` | Maximum number of help commands to run in parallel |
| `--format` | repeatable `json \| md` | `json` | Output format; repeat the flag to write multiple outputs |
| `--output` | string | `./docs` | Output directory |
| `--timeout` | integer | `5000` | Per-command timeout in ms |
| `--parser` | string | auto-detect | Force a parser plugin by name |

## Library Usage

`doclix` can also be used as a library:

```ts
import { generate, introspect } from 'doclix'

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
	format: ['json', 'md'],
})

console.log(generated.json)
console.log(generated.markdown)
```

Library API notes:

- `introspect(command, options)` returns `{ tree, warnings }`
- `generate(command, options)` returns `{ tree, json?, markdown?, warnings }`
- `options.format` supports `json` or `md`; pass an array for multiple outputs, and omit it to default to JSON
- `generate` options align with CLI flag names: `max-depth`, `timeout`, `concurrency`, `parser`, and `format`
- advanced injection (`executor`, `parserRegistry`) is available for tests/custom integration

## Supported Parsers

`doclix` uses a plugin-based parser registry. You can force one with `--parser`, or let `doclix` auto-detect.

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

For `doclix generate git --format=json --format=md --output=./docs`, you get:

- `docs/git.json`
- `docs/git.md`

Why both formats:

- JSON is agent-ready because it is structured, stable, and easy to index, diff, validate, and consume in automation pipelines.
- Markdown is human-readable because it is hierarchy-first, scannable in docs/reviews, and works well in repos, wikis, and generated documentation sites.

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
