# Booking Tool - Quick Start (TL;DR)

Get started with the Booking Tool project in 5 minutes.

## Prerequisites

Set your Linear API key:
```bash
export LINEAR_API_KEY="your_api_key"
```

Get it from: https://linear.app/account/api

## The 5-Minute Workflow

### 1. View Available Tasks
```bash
python orchestrate.py list
```

### 2. Pick a Task and Prepare It
```bash
python orchestrate.py prepare 15 feature
```

(Replace `15` with the task ID, `feature` with `bugfix` or `refactor` as needed)

### 3. Review the Task Context
```bash
cat ../yellow-feature/CURRENT_TASK.md
```

Edit if needed to add acceptance criteria from Linear.

### 4. Let the Agent Work
```bash
cd ../yellow-feature
claude code
```

The agent will implement the task, push to GitHub, and notify you.

### 5. Review & Merge
- Go to GitHub
- Review the branch
- Create PR and merge
- Done!

## Task Types

| Type | Worktree | Command |
|------|----------|---------|
| New feature | yellow-feature | `prepare TASK_ID feature` |
| Bug fix | yellow-bugfix | `prepare TASK_ID bugfix` |
| Code improvement | yellow-refactor | `prepare TASK_ID refactor` |

## Common Commands

```bash
# List all Booking Tool tasks from Linear
python orchestrate.py list

# Prepare a task for implementation
python orchestrate.py prepare 15 feature

# Check worktree status
python orchestrate.py status

# Fetch latest tasks from Linear
python orchestrate.py fetch
```

## Example: Create Booking Widget (Task 15)

```bash
# 1. See available tasks
python orchestrate.py list

# 2. Prepare the feature task
python orchestrate.py prepare 15 feature

# 3. Review the generated context
vim ../yellow-feature/CURRENT_TASK.md

# 4. Let agent implement it
cd ../yellow-feature
claude code

# Wait for it to push to GitHub...

# 5. Review on GitHub and merge
```

## What the Agent Does

✅ Creates a proper feature/bugfix/refactor branch
✅ Implements the solution
✅ Follows project code patterns
✅ Runs tests and linting (`bun run check`)
✅ Commits with proper message format
✅ Pushes to GitHub

Then you review and merge on GitHub.

## Need Help?

- Full setup guide: `BOOKING_TOOL_SETUP.md`
- Workflow details: `.claude/WORKFLOW.md`
- Feature patterns: `.claude/FEATURE_AGENT.md`
- Bug fix strategies: `.claude/BUGFIX_AGENT.md`
- Refactoring guide: `.claude/REFACTOR_AGENT.md`

## Key Worktrees

```
yellow-feature/    ← Work on new features here
yellow-bugfix/     ← Work on bug fixes here
yellow-refactor/   ← Work on code improvements here
```

Each is independent, so you can work on multiple tasks in parallel!

---

**Ready?** Run `python orchestrate.py list` and pick your first task! 🚀
