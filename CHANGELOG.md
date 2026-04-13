# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-04-12

### Changed
- Made `--max-depth` optional with no default limit.
- `generate` now crawls to leaf commands by default, producing more complete docs unless a depth cap is explicitly provided.
- Library APIs no longer apply an implicit `maxDepth` fallback when omitted.
- Renamed output-scoped options to `--output-{format}-{short-name}` naming.
- Refined generated HTML header controls so project and theme actions share consistent icon-button styling.

### Added
- Added `--output-html-title` to customize generated HTML page titles.
- Added `--output-html-project-link` to show a project link in generated HTML header navigation.
- Added `--output-html-readme` to load a `.md` file and render it as a README section in generated HTML pages.

## [0.2.0] - 2026-04-10

### Added
- Support to Thor (ruby).
- Support to Picocli (java).
- Support to urfave/cli (go).
- Support to System.CommandLine and CommandLineParser (c#).

## [0.1.0] - 2026-04-10

### Added
- Initial release.

[Unreleased]: https://github.com/haoliangyu/cmdgraph/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/haoliangyu/cmdgraph/releases/tag/v0.3.0
[0.2.0]: https://github.com/haoliangyu/cmdgraph/releases/tag/v0.2.0
[0.1.0]: https://github.com/haoliangyu/cmdgraph/releases/tag/v0.1.0