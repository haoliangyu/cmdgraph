# Parser Implementation Guide

Purpose: provide a concise reference for future agents implementing or extending CLI output parsers in cmdgraph.

## Scope

This spec covers parser architecture, implementation requirements, parser interfaces, and practical examples.

It is focused on the parser subsystem only (not executor/crawler/formatter internals beyond parser touchpoints).

## Architecture Summary

Parser flow in cmdgraph:

1. Executor runs `<command> --help` and returns text.
2. `ParserRegistry` selects parser (forced name, detect, fallback).
3. Selected parser returns `ParsedCommand`.
4. Crawler uses `subcommands` to recurse.

Key files:

- `src/core/parser.ts`: parser interface contract.
- `src/core/parser-registry.ts`: parser registration/selection.
- `src/parsers/heuristic.ts`: default tolerant parser.
- `src/parsers/oclif.ts`: framework-specific parser plugin.
- `src/parsers/cobra.ts`: framework-specific parser plugin.
- `src/parsers/thor.ts`: framework-specific parser plugin for Thor-style CLIs.
- `src/parsers/picocli.ts`: framework-specific parser plugin for picocli-style Java CLIs.

Registry behavior:

- If `--parser <name>` is passed, that parser is required.
- Else, first parser with `detect(helpText) === true` is selected.
- If no parser matches, `heuristic` is used as fallback.

## Data Contract

Parsers must output the `ParsedCommand` shape:

```ts
export interface Option {
  flag: string
  description: string
}

export interface ParsedCommand {
  name: string
  description?: string
  usage?: string
  options: Option[]
  subcommands: string[]
}
```

Parser output quality directly affects recursion, output stability, and agent usability.

## Implementation Requirements

### Functional requirements

- Parse at minimum: `name`, `usage`, `options`, `subcommands`.
- Be robust to spacing and heading variations.
- Support common heading families:
  - usage
  - commands / available commands / core commands / additional commands
  - options / flags / global flags
- Avoid extracting dynamic placeholders as subcommands (for example `<name>`, `[resource]`, `:id`).
- Return empty arrays (not `undefined`) for `options` and `subcommands`.

### Behavioral requirements

- `detect()` should be conservative for specialized parsers.
- Heuristic parser should remain broad and safe as fallback.
- Preserve deterministic ordering from input where possible.
- Never throw on parse noise; prefer best-effort extraction.

### Quality requirements

- Strict TypeScript, no `any`.
- No side effects in parser logic (pure transform from text to object).
- Keep regexes readable and maintainable.
- Add tests for each new parsing rule and regression.

## Parser Interface

```ts
export interface CLIParser {
  name: string
  detect(helpText: string): boolean
  parse(helpText: string): ParsedCommand
}
```

Notes:

- `name` must be unique across registry entries.
- `detect` decides auto-selection eligibility.
- `parse` is the single source of structured extraction.

## Current Heuristic Strategy

The heuristic parser currently uses a tolerant, section-based strategy:

- Finds heading ranges (`X:` blocks) and extracts section content.
- Extracts usage as single-line or multiline block.
- Parses options using spacing/tab separators.
- Parses subcommands from command sections or indented fallback lines.
- Extracts description with known-heading guards to avoid false positives.

This strategy is intended to work across Git-style, Docker-style, Kubectl/Cobra-style, and similar outputs.

Specialized parser plugins (for example oclif, cobra, thor, picocli) may apply lightweight normalization before delegating to the heuristic parser so extraction remains stable while detection stays framework-aware.

## Examples

### Example A: Generic CLI

Input snippet:

```text
Usage: tool [command]

Commands:
  build     Build project
  test      Run tests

Options:
  -h, --help   Show help
```

Expected parse result:

```json
{
  "name": "tool",
  "usage": "tool [command]",
  "options": [{ "flag": "-h, --help", "description": "Show help" }],
  "subcommands": ["build", "test"]
}
```

### Example B: Categorized Command Blocks (Git-like)

Input snippet:

```text
usage: git [...]

These are common Git commands used in various situations:

start a working area
   clone      Clone a repository
   init       Initialize repository
```

Expected parser behavior:

- `name = "git"`
- `description` captures the descriptive sentence.
- `subcommands` includes `clone`, `init`.

### Example C: Core/Additional Commands (GH-like)

Input snippet:

```text
Usage:
  gh <command> <subcommand> [flags]

Core Commands:
  repo   Work with repositories

Additional Commands:
  alias  Create shortcuts
```

Expected parser behavior:

- Detect command sections in multiple heading variants.
- Include both `repo` and `alias` in `subcommands`.

### Example D: Thor-style Commands (Bundler/Thor-like)

Input snippet:

```text
Usage:
  thor COMMAND [ARGS]

Commands:
  thor help [COMMAND]  # Describe available commands
  thor list [SEARCH]   # Search commands
```

Expected parser behavior:

- Specialized `thor` parser is selected.
- Parsed name resolves to `thor` (or the root command from usage).
- Subcommands include `help`, `list`.

### Example E: Picocli-style Commands (Java/picocli-like)

Input snippet:

```text
Usage: acme [-hV] [COMMAND]

Commands:
  init      Initialize project
  deploy    Deploy project

Options:
  -h, --help      Show this help message and exit.
  -V, --version   Print version information and exit.
```

Expected parser behavior:

- Specialized `picocli` parser is selected.
- Parsed name resolves to `acme` from usage.
- Subcommands include `init`, `deploy`.

## Testing Guidance

When adding/updating parser behavior:

- Add unit fixtures under `test/unit/fixtures`.
- Add assertions in `test/unit/heuristic-parser.test.ts` (or parser-specific tests).
- Cover at least one positive case and one ambiguity/regression case.
- Keep real CLI variance covered by CI-only e2e tests in `test/e2e` (for Thor support, include Bundler CLI where available and auto-skip when unavailable; for picocli support, include a Java CLI such as Gradle where available and auto-skip when unavailable).

## Extension Pattern for New Parsers

To add a new parser plugin:

1. Create `src/parsers/<name>.ts` implementing `CLIParser`.
2. Keep `detect` specific to that framework's output signatures.
3. Implement `parse`; delegate to heuristic only if appropriate.
4. Register parser in `createDefaultParserRegistry()`.
5. Add unit tests + fixtures.
6. Document parser in README Supported Parsers section.

## Non-goals

- Running commands from parser logic.
- Interactive prompt handling.
- Framework-specific AST beyond `ParsedCommand` contract.

## Decision Notes for Future Agents

- Prefer resilient extraction over strict grammar assumptions.
- Fail soft: partial structured output is better than throw.
- Keep parser output stable across minor help text formatting changes.
