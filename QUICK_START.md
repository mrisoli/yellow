# Quick Start - Semi-Autonomous Workflow

## Setup Verification ✅

Worktrees created:
```
yellow-feature    (worktree/feature)
yellow-bugfix     (worktree/bugfix)
yellow-refactor   (worktree/refactor)
```

Helper script ready:
```bash
python orchestrate.py
```

---

## Typical Task Flow

### 1. Get Task Details from Linear
- Note the Linear issue ID (e.g., 123)
- Note the type: feature, bugfix, or refactor
- Copy description and acceptance criteria

### 2. Prepare Task Context
```bash
python orchestrate.py prepare 123 feature
```

Creates `../yellow-feature/CURRENT_TASK.md`

### 3. Fill in Task Details
```bash
cd ../yellow-feature
# Edit CURRENT_TASK.md with:
# - Task title/description (from Linear)
# - Acceptance criteria (from Linear)
# - Any related issues
```

Time: 2-3 minutes

### 4. Invoke Agent
```bash
claude code
# Agent reads CURRENT_TASK.md and starts work
```

### 5. Wait & Review
- Agent implements, commits, and pushes to GitHub
- Review the branch on GitHub
- Create PR via GitHub
- Merge when ready

### 6. Update Linear (Optional)
- Mark task as Done in Linear

---

## Parallel Tasks Example

```bash
# Terminal 1 - Feature work
cd yellow-feature
python ../yellow/orchestrate.py prepare 123 feature
# Edit CURRENT_TASK.md
claude code

# Terminal 2 - Meanwhile, bugfix
cd yellow-bugfix
python ../yellow/orchestrate.py prepare 45 bugfix
# Edit CURRENT_TASK.md
claude code

# Terminal 3 - Check status
cd yellow
python orchestrate.py status
```

---

## Key Conventions

### Branch Naming
```
{type}/LINEAR-{id}-{description-slug}
```

### Commit Format
```
{type}(scope): description [LINEAR-{id}]
```

### Task Template Location
```
../yellow-{type}/CURRENT_TASK.md
```

---

## Worktree Directories

From project root (`yellow/`):

- Feature work: `../yellow-feature`
- Bugfix work: `../yellow-bugfix`
- Refactor work: `../yellow-refactor`

---

## Documentation Reference

| File | Read When |
|------|-----------|
| `WORKFLOW_GUIDE.md` | Overview of entire workflow (this might be helpful) |
| `.claude/WORKFLOW.md` | Detailed agent specializations and conventions |
| `.claude/FEATURE_AGENT.md` | Working on features - patterns and examples |
| `.claude/BUGFIX_AGENT.md` | Fixing bugs - debugging strategies |
| `.claude/REFACTOR_AGENT.md` | Refactoring - improvement patterns |
| `.claude/TASK_TEMPLATE.md` | Template for CURRENT_TASK.md files |

---

## Commands Reference

```bash
# Show workflow status
python orchestrate.py list

# Prepare new task
python orchestrate.py prepare TASK_ID TYPE
# Example:
python orchestrate.py prepare 123 feature

# Show worktree status
python orchestrate.py status

# Navigate to worktree
cd ../yellow-feature
cd ../yellow-bugfix
cd ../yellow-refactor

# Invoke agent in worktree
claude code

# Check code quality
bun run check            # Lint and format
bun run check-types      # Type check
bun test                 # Run tests

# Development
bun run dev              # Full dev mode
bun run dev:web          # Web only
bun run dev:server       # Backend only
```

---

## What Happens When You Invoke `claude code`

1. Agent reads `CURRENT_TASK.md`
2. Creates feature branch: `{type}/LINEAR-{id}-{slug}`
3. Syncs with main: `git pull origin main`
4. Implements solution following project patterns
5. Writes tests for new code
6. Runs: `bun run check` and `bun run check-types`
7. Commits: `{type}(scope): description [LINEAR-{id}]`
8. Pushes to GitHub

**You get a GitHub branch ready for PR.**

---

## When Agent Asks Questions

If requirements are unclear or agent needs decisions, they'll add a comment to your Linear issue.

Check Linear for agent questions/escalations.

---

## Troubleshooting

**Agent seems stuck?**
```bash
cd ../yellow-{type}
git status      # Check for uncommitted changes
bun run check   # Check for linting errors
```

**Type errors?**
```bash
bun run check-types
```

**Need to abort?**
```bash
cd ../yellow-{type}
git reset --hard main
git checkout main
```

---

## That's It!

You're all set up for semi-autonomous development.

1. Get a Linear task
2. `python orchestrate.py prepare ID TYPE`
3. Fill in CURRENT_TASK.md
4. `claude code`
5. Review and merge

Happy shipping! 🚀
