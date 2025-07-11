# Obsidian Interviewer Guidelines for Codex Agents

## Development
- Node.js 16+ is required.
- Install dependencies with `npm install`.
- Use `npm run dev` during development (esbuild watch).
- Use `npm run build` before committing to ensure TypeScript compiles.

## Question Format
- Questions live in Markdown files with YAML frontmatter (`created`, `topic`, `tags`).
- Each question starts with a `###` heading and must end with `#easy`, `#medium`, or `#hard`.
- The line immediately after the heading is exactly `?`.
- The canonical answer follows after `?` and can span multiple lines.
- Candidate answers start with a blockquote line `> @candidate` and continue with `>` prefix until a blank line or next question.
- Only one candidate block per question.
- Leave one blank line between a candidate block and the next question heading.

Example:
```markdown
### What is Git and why is it used? #easy
?
Git is a free and open-source **distributed** VCS that tracks changes.

> @candidate
> Mixed Git with GitHub, missed "distributed".
```

## Repository Layout
- `templates/` contains interview templates (default: `templates/interview.md`).
- `base/` stores question banks grouped by topic.
- `main.ts` is the entry point for the plugin and compiles to `main.js` via esbuild.
- `manifest.json` and `versions.json` keep plugin and Obsidian version info.

## Building
- Run `npm run build` to generate `main.js` and validate TypeScript before submitting PRs.

