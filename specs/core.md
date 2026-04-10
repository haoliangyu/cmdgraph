# doclix — CLI Documentation Introspection Tool

## Overview

Build an npm CLI tool called **doclix** that recursively parses CLI tools (via `--help`) and generates structured documentation for AI agents.

The tool should:
- Discover commands and subcommands recursively
- Parse help output into structured data
- Support multiple CLI frameworks via plugin parsers
- Output JSON (primary/default) and Markdown (secondary)
- Be extensible, testable, and robust

The CLI itself must be built using **oclif**.

---

## Tech Stack

- Node.js (>=18)
- TypeScript
- CLI framework: oclif
- Process execution: execa
- Testing: vitest
- Linting: eslint + prettier
- Packaging: npm

---

## Project Goals

### Core Requirements

1. Execute a CLI command with `--help`
2. Parse output into structured format
3. Recursively discover subcommands
4. Build a command tree (AST)
5. Output:
   - JSON (primary, AI-friendly)
   - Markdown (secondary)

---

## CLI Usage

```bash
doclix generate <command> [options]
````

### Example

```bash
doclix generate kubectl --max-depth=3 --output=./docs
```

---

## CLI Options

| Option        | Description                   |
| ------------- | ----------------------------- |
| `--max-depth` | Limit recursion depth         |
| `--format`    | repeatable json or md         |
| `--output`    | Output directory              |
| `--timeout`   | Per-command execution timeout |
| `--parser`    | Force parser plugin           |

---

## Architecture

### High-Level Flow

```
CLI input
  → executor (run --help)
  → parser (plugin-based)
  → recursive crawler
  → command graph (AST)
  → formatter (JSON / Markdown)
```

---

## Core Modules

### 1. Executor

**File:** `src/core/executor.ts`

Responsibilities:

* Run CLI commands safely
* Use `execa`
* Enforce:

  * timeout
  * non-interactive env (`CI=1`, `NO_COLOR=1`)
* Return stdout as string

---

### 2. Parser Interface

**File:** `src/core/parser.ts`

Define a plugin interface:

```ts
export interface CLIParser {
  name: string
  detect(helpText: string): boolean
  parse(helpText: string): ParsedCommand
}
```

---

### 3. Parsed Data Model

**File:** `src/types.ts`

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

export interface CommandNode extends ParsedCommand {
  children: CommandNode[]
  path: string[]
}
```

---

### 4. Default Heuristic Parser

**File:** `src/parsers/heuristic.ts`

Responsibilities:

* Parse common patterns:

  * Usage:
  * Commands:
  * Options:
* Use regex-based extraction
* Be tolerant to formatting differences

---

### 5. Plugin System

**File:** `src/core/parser-registry.ts`

Responsibilities:

* Register parsers
* Select parser via:

  * explicit flag
  * auto-detect via `detect()`

Initial parsers:

* heuristic (default)
* placeholder for:

  * oclif
  * cobra

---

### 6. Recursive Crawler

**File:** `src/core/crawler.ts`

Responsibilities:

* Traverse command tree recursively
* For each command:

  * run `<command> --help`
  * parse output
  * discover subcommands
* Respect:

  * max depth
  * deduplication
  * cycle prevention

---

### 7. Formatter

**Files:**

* `src/formatters/json.ts`
* `src/formatters/markdown.ts`

Responsibilities:

#### JSON

* Output full command tree
* AI-friendly structure

#### Markdown

* Hierarchical sections
* Include:

  * description
  * usage
  * options
  * subcommands

---

### 8. CLI Command

**File:** `src/commands/generate.ts`

Responsibilities:

* Parse CLI flags
* Invoke crawler
* Call formatter(s)
* Write output files

---

## Testing Strategy

Use **vitest**.

### Unit Tests

* executor:

  * handles timeout
  * returns output
* parser:

  * parses sample help text fixtures
* crawler:

  * builds tree from mocked executor

---

### Fixtures

Create sample help outputs for:

* git
* docker
* kubectl

Store under:

```
test/unit/fixtures/
test/integration/fixtures/
```

---

### Mocking

* Mock executor in crawler tests
* Do NOT run real CLI commands in unit tests

---

## Error Handling

* Timeout → skip command with warning
* Parse failure → fallback to minimal structure
* Unknown format → use heuristic parser

---

## Non-Goals (for MVP)

* No LLM integration
* No network calls
* No auth handling
* No interactive CLI support

---

## Code Quality

* Strict TypeScript
* No `any`
* ESLint clean
* Prettier formatted

---

## Deliverables

The generated project should include:

* Working CLI (`doclix`)
* Modular architecture
* Plugin system scaffold
* Recursive crawler
* JSON + Markdown output
* Unit tests with fixtures
* README with usage

---

## Bonus (if time permits)

* concurrency control (p-limit)
* caching layer
* debug logging

---

## Acceptance Criteria

* Running:

```bash
doclix generate git --max-depth=2
```

Produces:

* valid JSON file
* valid Markdown file
* correctly nested command structure

---

## Notes for Implementation

* Prioritize clarity over cleverness
* Keep modules small and testable
* Design for extensibility (plugins)

---

## End of Spec

```

---

## How to use this

1. Create empty repo
2. Add this file as `doclix_BOOTSTRAP_SPEC.md`
3. Open Copilot / Codex
4. Prompt:

> “Implement this spec step by step. Start with project scaffolding, then core modules, then tests.”

---

If you want next iteration, I can:
- generate a **file-by-file scaffold (with code)**
- or design a **parser for oclif specifically** (that one is much cleaner than heuristic parsing)
