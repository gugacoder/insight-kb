# git-commit

> Realize the commit of already staged files with concise, standardized, and unambiguous commit messages, following the `conventional commits` model.
> Use TodoWrite to orient execution.

## Purpose

Precisely declare **what was changed and why**, in a way that is readable by both humans and machines, considering only changes in files already added to the staging area.

**Note**: Never add files to the staging area automatically.

## Structure

```bash
<type>(<scope>): <direct summary of the change>

- [optional] bullets with decisions or examples
```

## Common Types

* `feat`: Adds a new feature
* `fix`: Fixes a bug
* `docs`: Documentation changes
* `style`: Code style changes (spacing, semicolons, etc.) with no functional impact
* `refactor`: Code refactoring without changing functionality
* `perf`: Performance improvements
* `test`: Adding or updating tests
* `build`: Changes that affect the build system or dependencies
* `ci`: Changes to CI configuration files and scripts
* `chore`: Other changes that don't modify src or tests
* `revert`: Reverts a previous commit

## Recommended Scopes

* `system`, `commands`, `blueprint`, `template`
* `domain`, `feature`, `task`
* `docs` (when cross-cutting)

## Examples

```bash
docs(system): convert CLAUDE.md to README.md

- Removed AI references
- Standardized with DFT structure
```

```bash
feat(feature): add comments to blog
fix(task): fix bug in JSON export
```

## Restrictions

* Do not describe the step-by-step — declare **the final outcome**
* Avoid vague terms like "adjustments" or "improvements"
* Do not include explanations outside the commit message

## Tip

If the change isn't testable, the commit should at least be **traceable and atomic**.
