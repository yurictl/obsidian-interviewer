# Callout Format Implementation

This document describes the callout format implementation for interview questions and candidate answers.

## Question Format

Questions are rendered as Obsidian callouts with the following structure:

```markdown
> [!question]- 🟢 What is Git and why is it used?
> Git is a free and open-source distributed VCS
```

### Difficulty Indicators

- 🟢 Easy (green)
- 🟡 Medium (yellow)
- 🔴 Hard (red)
- ❓ Unknown difficulty

## Candidate Answer Format

When a candidate answer is added, it's inserted within the same callout block:

```markdown
> [!question]- 🟢 What is Git and why is it used?
> Git is a free and open-source distributed VCS
>
> @candidate
> Candidate's answer here

```

**Important**: There must be an empty line after the candidate answer block to properly close the callout. Without it, the next question will be rendered inside the current callout block.

## Key Implementation Details

### Adding New Answer (main.ts:504-520)

- Find insertion point after canonical answer
- Add separator line `>`
- Add `> @candidate` marker
- Add formatted answer lines (each prefixed with `>`)
- **Add empty line** to close callout block

```typescript
currentLines.splice(insertIndex + 1, 0, '>', '> @candidate', ...formatted, '');
```

### Editing Existing Answer (main.ts:493-503)

- Calculate lines to remove (including trailing empty line if exists)
- Replace with new answer
- **Add empty line** to close callout block

```typescript
currentLines.splice(answerLineIndex, linesToRemove, '> @candidate', ...formatted, '');
```

### Deleting Answer (main.ts:472-492)

- Find start by walking back to include `>` separator line(s)
- Find end including trailing empty line
- Remove entire block from separator through answer and trailing empty line

```typescript
const removeCount = removeEnd - removeStart + 1;
currentLines.splice(removeStart, removeCount);
```

## Regex Patterns Used

```typescript
// Matches question callout line
const CALLOUT = /^>\s*\[!question\]-?\s*[🟢🟡🔴❓]\s*(.+)$/i;

// Matches @candidate marker
const CANDIDATE_START = /^>\s*@candidate\s*$/i;

// Matches any callout line
const CALLOUT_LINE = /^>\s*(.*)$/;

// Matches non-callout line (doesn't start with >)
const NOT_CALLOUT = /^[^>]/;
```

## CSS Styling

Candidate answers are styled as blockquotes within the callout (styles.css:190-228):

- Border-left accent color
- Light background
- Padding and border-radius
- `@candidate` label styled as uppercase header
- Answer text in italics

## Common Issues and Fixes

### Issue: Next question breaks into previous callout

**Cause**: Missing empty line after candidate answer

**Fix**: Always add empty line when inserting or replacing answers (see code above)

### Issue: Orphan `>` lines after deletion

**Cause**: Not removing separator lines before `@candidate`

**Fix**: Walk back to find all `>` separator lines and include in removal (lines 477-480)

### Issue: Answer edits lose trailing empty line

**Cause**: Removing empty line but not adding it back

**Fix**: Always include empty line in splice replacement (line 502)
