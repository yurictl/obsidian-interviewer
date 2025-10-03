# Changelog

## [0.0.1] - 2025-10-26

### Added
- Initial release of Obsidian Interviewer plugin
- Template-based interview creation system
- Question bank management with topic-based organization
- Interactive interview tools with real-time commenting
- Interview assessment and reporting features
- Collapsible sections for better interview flow
- Template comments for quick candidate response recording

## [0.0.2] - 2025-07-01

### Added
- Added Cursor Rules to stabilize development.

### Changed
- Changed the logic for forming the final file. Using links to question files instead of tags.
- Changed question format and refactored code.

## [0.0.3] - 2025-07-11

### Added
- Trying OpenAI Codex - added AGENTS.md

### Changed
- Fix a bug with questions formationg.

## [0.0.4] - 2025-07-12

### Added
- Jest-based unit tests for core utilities

## [0.0.5] - 2025-07-12

### Fixed
- Preserve Markdown formatting when inserting candidate answers

## [0.0.6] - 2025-07-13

### Changed
- Interview notes now render questions using HTML `<details>` blocks for better display in Obsidian.

## [0.0.7] - 2025-07-14

### Added
- Unit test coverage for `slugify` helper

## [0.1.0] - 2025-10-03

### Changed
- Migrated from HTML details blocks to Obsidian callout format for rendering interview questions
- Improved candidate answer handling in callout blocks with better parsing and formatting
- Removed Jest testing infrastructure to simplify project dependencies

### Added
- Claude Code integration with project documentation (CLAUDE.md, .claude/ directory)
- Detailed callout format implementation notes (CALLOUT_FORMAT.md)
- Deploy script for easier plugin installation

### Removed
- Jest test configuration and mock files
- Legacy HTML details-based question rendering