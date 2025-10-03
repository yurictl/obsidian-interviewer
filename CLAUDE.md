# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian Interviewer is an Obsidian plugin that streamlines the technical interview process. It creates structured interview notes from templates, pulls questions from a tagged question bank, and provides interactive tools for recording candidate responses during interviews.

## Development Commands

- `npm run dev` - Build in watch mode for development
- `npm run build` - Build for production (runs TypeScript type check first)
- `npm run version` - Bump version and update manifest/versions.json

## Architecture

### Core Plugin (main.ts)

Single-file plugin (~900 lines) with these main components:

**InterviewerPlugin**: Main plugin class that handles:
- Creating interview notes from templates (main.ts:565-635)
- Extracting questions from linked files (main.ts:637-774)
- Adding interactive UI buttons to questions via markdown post-processor (main.ts:22-533)

**Question Format Parsing**: The plugin uses callout format for rendering questions:
- Question bank format: `### Question text #difficulty`
- Rendered format: `> [!question]- 🟢 Question text` (callout with difficulty emoji)

See [CALLOUT_FORMAT.md](./CALLOUT_FORMAT.md) for detailed implementation notes on the callout format, candidate answers, and common issues.

**Question Structure**: Questions follow this pattern:
```
### Question text #easy|medium|hard
?
[canonical answer]

> @candidate
> [candidate's answer during interview]
```

**Interview Creation Flow**:
1. Reads template from `settings.templatePath` (default: `templates/interview.md`)
2. Finds `[[wikilinks]]` in the template
3. For each link, locates the corresponding markdown file in the vault
4. Extracts questions (h3 headers with #easy, #medium, #hard tags)
5. Sorts questions by difficulty (easy → medium → hard)
6. Converts to callout format using `createInteractiveQuestion()` (main.ts:800-821)
7. Replaces `{{date}}` placeholder with current date
8. Creates new interview file in `settings.interviewFolder`

### Interactive Features

The markdown post-processor adds buttons to the rendered output:
- ✏️ button on questions: Opens modal to add/edit candidate answers
- ✓ button on sections: Collapses section and re-sorts answered questions by difficulty

### Key Utilities

- `extractQuestionsFromFile()`: Parses question files and returns sorted questions (main.ts:637-774)
- `createInteractiveQuestion()`: Converts question data to callout format (main.ts:800-821)
- Callout handler: Adds/edits/deletes candidate answers in callout blocks (main.ts:354-533)

### Settings

Configurable via `InterviewerSettingTab`:
- `templatePath`: Path to interview template (default: `templates/interview.md`)
- `interviewFolder`: Target folder for new interviews (default: `/`)

### Modal Interactions

`CandidateAnswerModal`: Popup for adding/editing candidate answers. Pre-fills with existing answer if present.

## Development Notes

- Plugin uses esbuild for bundling (see esbuild.config.mjs)
- TypeScript with strict null checks enabled
- Built for Obsidian API (obsidian package provides types)
- To test: Copy main.js, manifest.json, styles.css to vault's `.obsidian/plugins/obsidian-interviewer/`
- The plugin works in both desktop and mobile Obsidian

## Question Bank Format

Question bank files should use the format:
```markdown
### What is Git? #easy
?
Git is a distributed version control system.

### Explain rebasing #hard
?
Rebasing rewrites commit history...
```

The template references these files via wikilinks (e.g., `[[git questions]]`), and the plugin automatically pulls all questions with difficulty tags when creating an interview.
