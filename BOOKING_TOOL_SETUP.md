# Booking Tool Project - Linear Integration Setup

Welcome! This document explains how the Yellow monorepo is set up to track and work on the Booking Tool project from Linear.

## Quick Start

### 1. Ensure Your Environment is Set Up

The integration requires the `LINEAR_API_KEY` environment variable:

```bash
# Check if it's set
echo $LINEAR_API_KEY

# If not set, add to your shell config (~/.zshrc, ~/.bashrc, etc.)
export LINEAR_API_KEY="your_linear_api_key_here"

# Then reload:
source ~/.zshrc  # or ~/.bashrc
```

Get your Linear API key from: https://linear.app/account/api

### 2. View Available Tasks

```bash
python orchestrate.py list
```

This shows:
- All Booking Tool tasks grouped by status (Backlog, Todo, In Progress, Done)
- Worktree status (feature/bugfix/refactor)
- Quick reference commands

### 3. Prepare a Task

Pick a task ID from the list and prepare it:

```bash
# Example: Prepare task 15 (Create booking widget) as a feature
python orchestrate.py prepare 15 feature
```

This creates `CURRENT_TASK.md` in the `yellow-feature` worktree with:
- Task title and description (fetched from Linear)
- Status and labels
- Placeholder for acceptance criteria
- Implementation guidelines

### 4. Edit Task Context

Open the generated file and review/complete it:

```bash
# View the created context file
cat ../yellow-feature/CURRENT_TASK.md

# Or edit it if you need to add details
vim ../yellow-feature/CURRENT_TASK.md
```

Add the acceptance criteria if not automatically filled from Linear.

### 5. Let the Agent Work

```bash
# Navigate to the appropriate worktree
cd ../yellow-feature

# Invoke the Claude Code agent
claude code
```

The agent will:
1. Read `CURRENT_TASK.md` for context
2. Create a feature branch following naming conventions
3. Implement the solution
4. Run tests and linting
5. Commit and push to GitHub

### 6. Review and Merge

Once pushed to GitHub:
1. Review the branch changes
2. Create a PR via GitHub interface
3. Merge when satisfied
4. Optional: Update Linear task status to "Done"

## Project Structure

The Booking Tool project uses these worktrees for parallel development:

```
workspace/
├── yellow/                    # Main repo (current directory)
│   ├── .claude/              # Claude Code configuration
│   ├── apps/web/             # Next.js frontend
│   ├── packages/backend/     # Convex backend
│   ├── orchestrate.py        # Task orchestrator (THIS SCRIPT)
│   ├── BOOKING_TOOL_SETUP.md # This file
│   └── ...
├── yellow-feature/           # Feature development worktree
├── yellow-bugfix/            # Bugfix development worktree
└── yellow-refactor/          # Refactor development worktree
```

Each worktree is independent, allowing parallel work on multiple tasks.

## Available Commands

### List Tasks (with Linear Integration)

```bash
python orchestrate.py list
```

Shows current Booking Tool tasks from Linear organized by status.

### Prepare a Task

```bash
python orchestrate.py prepare TASK_ID TYPE

# Examples:
python orchestrate.py prepare 15 feature      # Feature task
python orchestrate.py prepare 20 bugfix       # Bugfix task
python orchestrate.py prepare 25 refactor     # Refactor task
```

The script will:
- Fetch task details from Linear
- Create `CURRENT_TASK.md` in the appropriate worktree
- Display next steps

### Check Worktree Status

```bash
python orchestrate.py status
```

Shows which branches are checked out in each worktree and what changes exist.

### Fetch Latest Tasks

```bash
python orchestrate.py fetch
```

Explicitly fetch the latest Booking Tool tasks from Linear.

## Understanding Task Types

### Feature Tasks (`type:feature`)
- **Worktree:** yellow-feature
- **Branch:** `feature/LINEAR-{id}-{slug}`
- **Examples:** "Create booking widget", "Add availability calendar"
- **Agent:** Implements new functionality following existing patterns

### Bugfix Tasks (`type:bug`)
- **Worktree:** yellow-bugfix
- **Branch:** `bugfix/LINEAR-{id}-{slug}`
- **Examples:** "Fix timezone handling", "Resolve booking race condition"
- **Agent:** Fixes issues with minimal changes and regression tests

### Refactor Tasks (`type:refactor`)
- **Worktree:** yellow-refactor
- **Branch:** `refactor/LINEAR-{id}-{slug}`
- **Examples:** "Extract validation logic", "Improve component performance"
- **Agent:** Improves code quality without changing behavior

## Booking Tool Tasks Overview

The Booking Tool is an appointment booking SaaS being built in the Yellow monorepo.

### Current Priority Task: Create Booking Widget

**Task ID:** UNL-15

**Description:**
Add a project in the monorepo that is the booking widget - a package that can be rendered within another application.

**Requirements:**
- Render a calendar with dates (current month as default)
- Display available timeslots when date selected (30 min default, overridable)
- Accept block times to prevent booking during busy times
- Prompt for email after selection
- Submit form to configurable URL (localhost default)

**Branch:** `celorisoli/unl-15-create-booking-widget`

To work on this task:

```bash
python orchestrate.py prepare 15 feature
# Edit CURRENT_TASK.md with acceptance criteria
cd ../yellow-feature
claude code
```

## Workflow Steps

### Step 1: Select Task
Review the task list from `python orchestrate.py list` and pick one to work on.

### Step 2: Prepare Context
```bash
python orchestrate.py prepare <TASK_ID> <TYPE>
```

This creates the task context file in the appropriate worktree.

### Step 3: Review Context
Open `CURRENT_TASK.md` in the selected worktree and verify:
- Task title and description match Linear
- Status and labels are correct
- Add acceptance criteria if needed
- Check for related issues

### Step 4: Invoke Agent
```bash
cd ../yellow-<type>
claude code
```

The agent reads `CURRENT_TASK.md` and begins implementation automatically.

### Step 5: Monitor Progress
The agent will work autonomously:
- Create appropriate feature/bugfix/refactor branch
- Implement following project patterns
- Run tests and linting
- Commit with proper format
- Push to GitHub

You can check progress with:
```bash
python orchestrate.py status
```

### Step 6: Review & Merge
Once the agent pushes changes:
1. Go to GitHub and review the branch
2. Create a PR if needed
3. Merge when satisfied
4. Optionally update Linear task status

## Code Patterns & Guidelines

The agents follow these patterns (already configured):

### File Structure
- `apps/web/src/components/` - React components
- `apps/web/src/app/` - Next.js pages
- `packages/backend/convex/` - Backend functions
- Kebab-case filenames, PascalCase components, camelCase functions

### TypeScript
- Strict mode enabled
- Full type annotations required
- No `any` types
- Proper error handling

### React/Next.js
- Use `"use client"` for client components
- Functional components with hooks
- TailwindCSS for styling
- shadcn/ui components for UI primitives

### Backend (Convex)
- Use Convex mutations for writes, queries for reads
- Clerk authentication integration
- Typed validators with Convex `v.*()` functions

### Testing & Quality
- Run `bun run check` before committing
- Follow Biome linting rules
- Type check with `bun run check-types`
- Tests for new functionality

For detailed patterns, see:
- `.claude/WORKFLOW.md` - Core workflow and conventions
- `.claude/FEATURE_AGENT.md` - Feature implementation patterns
- `.claude/BUGFIX_AGENT.md` - Bug fixing strategies
- `.claude/REFACTOR_AGENT.md` - Refactoring patterns

## Troubleshooting

### Agent Didn't Start
Check `CURRENT_TASK.md` exists and is properly formatted:
```bash
ls ../yellow-feature/CURRENT_TASK.md
cat ../yellow-feature/CURRENT_TASK.md
```

### Task Details Not Fetched from Linear
Ensure `LINEAR_API_KEY` is set:
```bash
echo $LINEAR_API_KEY
```

If empty, set it in your shell config and reload.

### Branch Not Pushed
Check for uncommitted changes:
```bash
cd ../yellow-feature
git status
```

If changes exist, the agent may have encountered an error. Check:
```bash
bun run check        # Lint and format issues
bun run check-types  # TypeScript errors
```

### Merge Conflicts
If multiple tasks touch the same files:
```bash
cd ../yellow-feature
git status           # See conflicts
# Resolve manually in editor
bun run check        # Ensure formatting
git add .
git commit -m "merge: resolve conflicts"
git push
```

## Linear Integration Details

The orchestration system fetches task data via the Linear GraphQL API:

- **API Endpoint:** https://api.linear.app/graphql
- **Project ID:** bad5da33-f38d-475a-a433-678168ee9a3c (Booking Tool)
- **Auth:** Bearer token via `LINEAR_API_KEY` environment variable

### What Gets Fetched

For each task:
- Identifier (e.g., UNL-15)
- Title
- Description
- Status
- Labels
- Git branch name (if set)
- Assignee information

### Automatic Branch Naming

If the Linear issue has a `gitBranchName` set, that will be used. Otherwise, a branch name is generated from:
- Task type (feature/bugfix/refactor)
- Task ID
- Title slug (first 50 chars)

Example: `feature/LINEAR-15-create-booking-widget`

## Monitoring Task Progress

### Check Current Status

```bash
python orchestrate.py status
```

Shows all worktrees and their current branches/changes.

### View Linear Project

Open the Booking Tool project directly:
https://linear.app/unlikely-labs/project/booking-tool-07662ae06881

Mark tasks as done after merging to keep Linear in sync.

### Git Branch Status

Check what's been implemented:
```bash
cd ../yellow-feature
git log --oneline -10        # Recent commits
git branch -a               # All branches
git diff main..HEAD         # Changes to review
```

## Performance Tips

1. **Keep Tasks Focused** - Smaller tasks execute faster and are easier to review
2. **Use Proper Types** - Specify feature/bugfix/refactor so agent goes to right worktree
3. **Complete Context** - Fill in acceptance criteria for faster implementation
4. **Link Dependencies** - Note related issues to provide context
5. **Parallel Work** - Use different worktrees simultaneously in different terminals

## Next Steps

1. ✅ Run `python orchestrate.py list` to see available tasks
2. ✅ Pick a task to work on
3. ✅ Run `python orchestrate.py prepare TASK_ID TYPE`
4. ✅ Review the generated `CURRENT_TASK.md`
5. ✅ `cd ../yellow-<type> && claude code`
6. ✅ Wait for the agent to complete and push
7. ✅ Review on GitHub and merge
8. ✅ Update Linear task status to "Done"

Happy shipping! 🚀
