# Copilot Conventions for doclix

This repository is a TypeScript CLI tool that recursively introspects command help output and generates docs in multiple formats.

## Primary goals

- Keep generated output deterministic and test-friendly.
- Preserve backward compatibility for CLI flags and library API behavior.
- Favor small, focused changes over broad refactors.

## Architecture map

- Entry points:
  - `src/index.ts`: library exports (`generate`, `introspect`)
  - `src/commands/generate.ts`: CLI command behavior
- Core pipeline:
  - `src/core/crawler.ts`: recursive command discovery
  - `src/core/executor.ts`: command execution and timeout handling
  - `src/core/parser-registry.ts`: parser selection and registration
  - `src/core/parser.ts`: parser interfaces and shared parsing logic
- Parsers:
  - `src/parsers/*.ts`: framework-specific parser plugins and fallback heuristic parser
- Formatters:
  - `src/formatters/*.ts`: JSON, Markdown, HTML, `llms.txt`, and sitemap outputs

## Coding conventions

- Use existing TypeScript style in the file being edited (indentation, naming, and export style).
- Avoid introducing new dependencies unless necessary.
- Prefer explicit types on exported APIs and interfaces.
- Keep parser logic resilient to noisy real-world CLI help text.
- Do not remove or rename existing output fields unless explicitly requested.

## Parser and crawler expectations

- Maintain parser detection order and fallback behavior.
- Preserve recursion, depth, and concurrency semantics in crawler logic.
- Keep executor behavior non-interactive and timeout-safe.
- Add narrowly scoped parser fixes rather than broad regex rewrites when possible.

## Output format expectations

- Keep JSON shape stable unless a change is requested and tested.
- Keep Markdown heading hierarchy and command ordering predictable.
- Keep HTML output static-hosting friendly.
- Keep `llms.txt` and `sitemap.xml` generation explicit and aligned with `siteBaseUrl` behavior.

## Testing requirements

- Add or update tests for every behavior change.
- Prefer targeted tests in:
  - `test/unit` for parser/formatter/core logic
  - `test/integration` for crawling integration
  - `test/e2e` only when CLI end-to-end behavior changes
- If parser behavior changes, use or add fixtures in `test/unit/fixtures`.

## Validation checklist

Before finalizing substantial changes, run:

```bash
npm run lint
npm test
```

If CLI behavior/output formatting is changed, also run:

```bash
npm run test:e2e
```

## Change safety rules

- Do not modify unrelated files.
- Do not rewrite large files when a minimal patch is sufficient.
- Keep public CLI option names and defaults stable unless explicitly asked to change them.
- Call out any unavoidable breaking changes clearly in summaries.
