# Output Format Specification

Purpose: define the output architecture, contracts, and implementation requirements for all serialized formats in cmdgraph.

This spec establishes a strict pipeline:

1. Crawl and parse CLI help into a canonical command tree.
2. Serialize that tree as JSON.
3. Render all non-JSON formats from the same JSON-compatible tree.

JSON is the default output and the source of truth. Markdown, HTML, `llms.txt`, and `sitemap.xml` are explicit rendered formats. Any non-JSON format must be rendered from the canonical JSON data model rather than re-reading raw parser output or re-deriving structure independently.

## Scope

This spec covers:

- output architecture and data flow
- current format behavior
- format interfaces and contracts
- implementation requirements for current and future renderers
- examples and compatibility rules

This spec does not redefine parser internals, crawler recursion strategy, or executor behavior except where those systems affect output contracts.

## Architecture Summary

High-level flow:

```text
CLI help text
  -> executor
  -> parser registry
  -> ParsedCommand / CommandNode tree
  -> canonical JSON serialization
  -> format renderers
      -> current: Markdown, HTML, llms.txt, sitemap.xml
      -> future: YAML, XML, manpage, etc.
```

Current implementation touchpoints:

- `src/types.ts`: canonical in-memory output model
- `src/formatters/json.ts`: canonical JSON serializer
- `src/formatters/markdown.ts`: Markdown renderer from `CommandNode`
- `src/formatters/html.tsx`: HTML renderer from `CommandNode`
- `src/formatters/llms-txt.ts`: llms.txt renderer from `CommandNode`
- `src/formatters/sitemap.ts`: sitemap renderer from `CommandNode`
- `src/index.ts`: library API that returns `tree`, `json`, `markdown`, `html`, `llmsTxt`, and `sitemap`
- `src/commands/generate.ts`: CLI command that writes output files

## Design Principles

### 1. JSON is canonical

The `CommandNode` tree serialized by the JSON formatter is the authoritative representation of introspected CLI documentation.

Reasons:

- stable for programmatic consumption
- easy to diff, validate, test, and version
- preserves hierarchy explicitly
- suitable as an interchange layer between crawler/parsers and renderers
- prevents format-specific logic from diverging across outputs

### 2. Renderers are downstream only

Markdown and any future output format must treat the canonical tree as input.

A renderer may:

- reorder presentation for readability
- omit empty sections
- apply format-specific styling or escaping

A renderer must not:

- execute commands
- inspect raw help text directly
- re-parse help output
- infer new command structure not present in the canonical tree
- mutate the canonical data before other renderers use it

### 3. One data model, many views

All output formats represent the same command documentation with different presentation goals:

- JSON: machine-first, exact structure
- Markdown: human-first, readable hierarchy
- HTML: human-first, hosting-oriented static site
- llms.txt: discovery-first, compact text map for LLM agents
- sitemap.xml: discovery-first, search-engine sitemap for hosted docs
- future formats: specialized views for specific publishing or integration targets

## Canonical Data Model

The canonical model is the `CommandNode` structure.

```ts
export interface Option {
  flag: string
  description: string
}

export interface ParsedCommand {
  name: string
  description?: string
  usage?: string
  aliases: string[]
  arguments: string[]
  examples: string[]
  options: Option[]
  subcommands: string[]
}

export interface CommandNode extends ParsedCommand {
  children: CommandNode[]
  path: string[]
}
```

### Field semantics

- `name`: local command name for the node
- `description`: best-effort summary text for the command
- `usage`: normalized usage string or usage block summary
- `aliases`: alternate command names, preserving parser order
- `arguments`: documented positional argument names or signatures
- `examples`: representative command examples extracted from help output
- `options`: flags supported by the command
- `subcommands`: discovered child command names from the help text
- `children`: recursively introspected child nodes
- `path`: fully qualified command path from root to current node

### Invariants

- arrays must be present even when empty
- `path` must contain the full command path for the current node
- `children.length` should correspond to successfully crawled subcommands, not merely declared names
- `subcommands` preserves discovered names, even if a child could not be crawled
- output ordering should remain deterministic and follow source order where possible

## Current Output Formats

### JSON

Status: default, canonical, source of truth.

Current behavior:

- produced by `formatAsJson(root)`
- implemented as pretty-printed `JSON.stringify(root, null, 2)`
- written when `json` is included in the selected output formats
- returned by the library API when requested via `generate()`

JSON responsibilities:

- preserve complete command-tree structure
- preserve parsed metadata without presentation loss
- provide the most stable integration surface for agents, tests, and downstream renderers

JSON non-goals:

- human-optimized prose layout
- stylistic grouping or summarization beyond the canonical tree

### Markdown

Status: current secondary format.

Current behavior:

- produced by `formatAsMarkdown(root)`
- renders the command tree as nested headings
- omits empty sections
- displays usage, aliases, arguments, examples, options, and subcommands when present
- writes one Markdown document per generated root command

Markdown responsibilities:

- remain a faithful rendering of the JSON tree
- optimize for readability in repositories, docs, and review workflows
- present hierarchy clearly using heading depth

Markdown non-goals:

- becoming a richer source of truth than JSON
- carrying metadata that is unavailable in the canonical tree

### HTML

Status: current secondary format for static-site publishing.

Current behavior:

- produced by `formatAsHtml(root, options?)`
- renders a static single-page `index.html`
- uses a React server-rendered template
- supports optional output-scoped customizations for title and README section rendered from a markdown file
- uses Tailwind CSS and shadcn/ui-inspired component patterns
- defaults to a modern light-green theme and includes a dark mode toggle
- includes semantic landmarks, skip navigation, and accessible interactive controls
- includes client-side filtering for command discovery on large pages
- includes SEO and LLM-discovery metadata such as descriptive meta tags, structured data, and crawlable static content

HTML responsibilities:

- remain a faithful rendering of the JSON tree
- optimize for static hosting and human browsing
- provide a clear information hierarchy and command navigation
- support in-page discovery through filtering without hiding content from non-JavaScript crawlers
- expose enough semantic metadata for search engines and LLM agents to understand the page purpose and command inventory

HTML non-goals:

- becoming a richer source of truth than JSON
- requiring a separate site build pipeline to read generated documentation

### llms.txt

Status: current explicit discovery format for LLM-oriented crawlers and tooling.

Current behavior:

- produced by `formatAsLlmsTxt(root, options)`
- renders a compact text summary of the hosted docs and command inventory
- can use relative `index.html` links by default
- can use absolute URLs when `output-llms-txt-base-url` is provided

llms.txt responsibilities:

- remain a faithful derivative of the canonical tree
- provide a compact discovery-oriented index for LLM consumers
- stay explicit and separate from HTML output

### sitemap.xml

Status: current explicit discovery format for search engines.

Current behavior:

- produced by `formatAsSitemap(root, { siteBaseUrl })`
- renders a sitemap pointing at the hosted `index.html`
- requires `output-sitemap-base-url` because sitemap output must contain deployable site URLs

sitemap responsibilities:

- remain a faithful derivative of the canonical output contract
- provide a standards-aligned discovery artifact for hosted documentation
- stay explicit and separate from HTML output

## Current Interface Surface

### CLI interface

Current CLI output options:

```ts
type OutputFormat = 'json' | 'md' | 'html' | 'llms-txt' | 'sitemap'
```

Behavior:

- no `--format`: write canonical JSON only
- `--format=json`: write only canonical JSON
- `--format=md`: write only Markdown
- `--format=html`: write only static HTML
- `--format=llms-txt`: write only `llms.txt`
- `--format=sitemap`: write only `sitemap.xml` and require `--output-sitemap-base-url`
- repeated `--format` flags: write each selected output

Implementation note:

- even if only Markdown is written, the renderer still conceptually depends on the canonical tree, not on raw help text
- future implementation may choose to materialize JSON in memory first even when no `.json` file is emitted

### Library interface

Current library generation result:

```ts
export interface GeneratedDocumentation {
  tree: CommandNode
  json?: string
  markdown?: string
  html?: string
  llmsTxt?: string
  sitemap?: string
  warnings: string[]
}
```

Interpretation:

- `tree` is the canonical in-memory representation
- `json` is the serialized canonical output
- `markdown` is a rendered view derived from the same tree
- `warnings` report crawl/parser issues without changing output shape

Current library format selection:

```ts
format?: OutputFormat | OutputFormat[]
'output-root-command-name'?: string
'output-html-title'?: string
'output-html-readme'?: string // path to a .md file
'output-llms-txt-base-url'?: string
'output-sitemap-base-url'?: string
```

Behavior:

- omitted `format` defaults to `json`
- a single value requests one renderer
- an array requests multiple renderers
- `output-sitemap-base-url` is required for sitemap output
- `output-llms-txt-base-url` is optional and controls absolute URL generation for llms.txt

Normalization rule:

- format selection should be normalized through shared logic used by both the CLI and library surfaces
- normalization must default to `json`, remove duplicates, and preserve the first-seen order of requested formats
- HTML output must not implicitly generate `llms.txt` or `sitemap.xml`; those artifacts are opt-in formats

## Required Output Pipeline

All current and future formats must follow this logical path:

```text
CommandNode tree
  -> canonical JSON-compatible document
  -> renderer adapter
  -> target format
```

Practical requirement:

- formatters must accept `CommandNode` or an equivalent canonical document shape
- formatters must not depend on parser-specific types or raw executor output

Recommended internal layering for future work:

```ts
interface OutputRenderer {
  name: string
  fileExtension: string
  render(root: CommandNode): string
}
```

This interface is descriptive guidance for future expansion. It does not require immediate refactoring, but any new format should follow this pattern or an equivalent abstraction.

## Implementation Requirements

### General requirements

- JSON remains the canonical serialization format
- every new renderer must consume the canonical tree only
- renderer output must be deterministic for identical input
- empty arrays or missing optional values must be handled gracefully
- no renderer may mutate the provided `CommandNode`
- no renderer may introduce undocumented derived fields into the canonical model

### File generation requirements

- output file naming should remain consistent across formats for the same command stem
- adding a new format should only affect emitted files and format selection logic, not crawl semantics
- the root command should map to one output artifact per selected format

### Testing requirements

- JSON tests should assert canonical field presence and stability
- renderer tests should validate output from a fixed canonical fixture tree
- renderer tests must not rely on executing real CLIs
- if a new format is added, include at least one golden-output style test or equivalent stable assertion

### Backward-compatibility requirements

- changes to canonical JSON fields are breaking unless explicitly versioned and documented
- additive fields are preferred over renaming or repurposing existing fields
- Markdown changes may evolve presentation, but must not materially contradict the canonical JSON content

## Future Format Guidelines

Potential future formats include:

- YAML for configuration-oriented integrations
- XML for legacy pipelines
- manpage or roff output for terminal documentation
- plain text summaries for constrained environments

Requirements for any future format:

1. It must be generated from the canonical tree or canonical JSON-equivalent document.
2. It must define its audience and presentation goal clearly.
3. It must document how each canonical field maps into the target format.
4. It must define escaping, omission, and empty-section behavior.
5. It must not add command relationships not present in the canonical tree.

Recommended per-format design checklist:

- target audience
- required fidelity level
- section mapping for `description`, `usage`, `aliases`, `arguments`, `examples`, `options`, `subcommands`, and `children`
- encoding and escaping rules
- file extension and naming
- test strategy

## Examples

### Example A: Canonical JSON

Input tree concept:

- root command `git`
- one option
- two discovered subcommands

Expected JSON:

```json
{
  "name": "git",
  "description": "Distributed version control system",
  "usage": "git [options] [command]",
  "aliases": [],
  "arguments": [],
  "examples": [],
  "options": [
    {
      "flag": "-h, --help",
      "description": "Display help"
    }
  ],
  "subcommands": ["add", "commit"],
  "children": [],
  "path": ["git"]
}
```

### Example B: Markdown Derived From JSON

Given the canonical JSON above, valid Markdown could be:

```md
# Command Documentation

## git
Distributed version control system

**Usage:** `git [options] [command]`

**Options**
- `-h, --help`: Display help

**Subcommands**
- `add`
- `commit`
```

This Markdown is a presentation of the same data. It does not redefine or extend the canonical content.

### Example C: Future HTML Renderer

Conceptual mapping only:

- `path` -> page title / breadcrumb
- `description` -> summary paragraph
- `usage` -> code block
- `options` -> table
- `children` -> nested navigation sections

The HTML renderer would still consume the same canonical tree and would not call parser logic directly.

## Decision Rules For Future Agents

- If a question concerns output truth, prefer JSON.
- If a format-specific view disagrees with JSON, JSON is correct.
- If a new format needs extra data, first determine whether that data belongs in the canonical model.
- If the data is presentation-only, keep it in the renderer.
- If the data affects all formats, evolve the canonical model carefully and document the change.

## Idea Backlog

These ideas are intentionally documented for follow-up instead of immediate implementation.

### Discovery artifacts

- Add optional canonical URL override for HTML, llms.txt, and sitemap outputs.
- Add configurable path strategy for sitemap and llms.txt links:
  - `index.html` path style
  - directory-style path (`/docs/git/`)
  - custom page path template
- Add optional `robots.txt` output format for explicit crawler policy control.
- Add optional generation timestamp and version metadata blocks for discovery artifacts.

### HTML site UX

- Add optional command index sections grouped by depth and/or top-level namespace.
- Add optional sticky quick actions (`copy usage`, `copy command path`, `open anchor`).
- Add optional client-side highlight of matching terms in filtered command sections.
- Add optional keyboard shortcut (`/`) to focus command search input.

### LLM-oriented output

- Add optional strict profile for llms.txt with shorter, token-efficient entries.
- Add optional include/exclude controls for fields in llms.txt (`options`, `examples`, `aliases`, etc.).
- Add optional command-priority hints for large command trees.
- Add optional per-command short summaries optimized for retrieval indexing.

### Configuration and extensibility

- Add `--config` file support to centralize format settings (base URL, path style, metadata, profiles).
- Introduce a stable `OutputRenderer` registry for runtime-extensible renderer plugins.
- Add renderer capability flags (requires base URL, produces hostable page, discovery artifact, etc.).
- Add output profile presets (for example `hosting`, `llm-indexing`, `developer-docs`).

### Quality and validation

- Add schema validation for generated sitemap and llms.txt structures in tests.
- Add snapshot-style golden tests for HTML, llms.txt, and sitemap outputs from shared fixtures.
- Add compatibility tests to ensure discovery artifacts remain deterministic across parser variants.
- Add link-integrity checks to verify generated anchor URLs exist in HTML output.

## Non-goals

- supporting separate parser-specific output schemas per framework
- allowing Markdown or any other human-readable output to become canonical
- duplicating crawl or parse logic inside renderers
- creating parallel, format-specific command tree models