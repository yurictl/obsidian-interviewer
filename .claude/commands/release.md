# Release

Creates a new release by automatically analyzing changes, determining version type, and updating CHANGELOG, manifest version, and pushing to main.

## Usage

```
/release
```

The command will automatically:
- Analyze git changes (commits, diffs, file changes)
- Determine version type (patch/minor/major) based on changes
- Generate release description from commits and changes
- Update docs/CHANGELOG.md and manifest.json
- Commit and push to main

## Version Type Detection

The command analyzes changes to determine version bump:
- **major**: Breaking changes, API changes, major refactors
- **minor**: New features, enhancements, new functionality
- **patch**: Bug fixes, small improvements, documentation updates

## Steps

1. Run `git status` and `git diff` to see all changes
2. Run `git log` to analyze recent commits since last release
3. Analyze changes to determine:
   - What files changed (main.ts, package.json, etc.)
   - What type of changes (features, fixes, refactors)
   - Appropriate version bump type (patch/minor/major)
4. Generate description from commit messages and changes
5. Read current version from manifest.json
6. Increment version based on auto-detected type (semver)
7. Create/update CHANGELOG.md with new version entry and description
8. Update version in manifest.json
9. Commit changes with message: "chore: release v{version}"
10. Push to main branch
