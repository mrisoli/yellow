# Booking Tool - Integrated with Linear

Welcome to the Yellow monorepo's Booking Tool project! This repo is fully integrated with Linear for task management and semi-autonomous development.

## What is This?

The **Booking Tool** is an appointment booking SaaS being developed as a monorepo project. This setup allows you to:

- 📋 **View tasks** directly from Linear's Booking Tool project
- 🤖 **Invoke agents** that implement features/fixes/refactors automatically
- 🌳 **Use git worktrees** for parallel development on multiple tasks
- 📝 **Track progress** seamlessly between Linear and GitHub

## Getting Started (5 Minutes)

### 1. Set Your Linear API Key

```bash
export LINEAR_API_KEY="your_linear_api_key"
```

Get your key: https://linear.app/account/api

### 2. View Available Tasks

```bash
python orchestrate.py list
```

This shows all Booking Tool tasks from Linear, organized by status.

### 3. Pick a Task and Start

```bash
# Example: Prepare task 15 as a feature
python orchestrate.py prepare 15 feature

# Review the generated context
cat ../yellow-feature/CURRENT_TASK.md

# Invoke the agent
cd ../yellow-feature
claude code
```

That's it! The agent will implement the task, push to GitHub, and you review the PR.

## Documentation

We've created comprehensive guides for every scenario:

### Quick Reference
- **[BOOKING_TOOL_QUICK_START.md](BOOKING_TOOL_QUICK_START.md)** - 5-minute TL;DR version

### Detailed Guides
- **[BOOKING_TOOL_SETUP.md](BOOKING_TOOL_SETUP.md)** - Complete setup, workflow, and troubleshooting
- **[LINEAR_INTEGRATION_SUMMARY.md](LINEAR_INTEGRATION_SUMMARY.md)** - Technical architecture and integration details
- **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** - Semi-autonomous workflow with agent guidelines

### Code Standards
- **[.claude/WORKFLOW.md](.claude/WORKFLOW.md)** - Branch naming, commits, conventions
- **[.claude/FEATURE_AGENT.md](.claude/FEATURE_AGENT.md)** - Feature implementation patterns
- **[.claude/BUGFIX_AGENT.md](.claude/BUGFIX_AGENT.md)** - Bug fixing strategies
- **[.claude/REFACTOR_AGENT.md](.claude/REFACTOR_AGENT.md)** - Code improvement patterns

## How It Works

```
Linear Task
    ↓
python orchestrate.py prepare TASK_ID TYPE
    ↓
CURRENT_TASK.md (auto-fetched from Linear)
    ↓
claude code (agent reads context)
    ↓
Automated implementation, commit, push to GitHub
    ↓
You review PR and merge
```

## Key Features

✅ **Linear Integration**
- Automatically fetch task details from Linear API
- Use Linear git branch names
- Track tasks with LINEAR-{id} references in commits

✅ **Parallel Development**
- Three independent git worktrees (feature/bugfix/refactor)
- Work on multiple tasks simultaneously
- No branch conflicts

✅ **Intelligent Agents**
- Feature agent - builds new functionality
- Bugfix agent - fixes issues with minimal changes
- Refactor agent - improves code quality

✅ **Complete Documentation**
- Quick start (5 minutes)
- Detailed setup (30 minutes)
- Code patterns and guidelines
- Troubleshooting

## Commands

```bash
# List all Booking Tool tasks from Linear
python orchestrate.py list

# Prepare a task for implementation
python orchestrate.py prepare TASK_ID TYPE
# Example: python orchestrate.py prepare 15 feature

# Check worktree status
python orchestrate.py status

# Refresh task list from Linear
python orchestrate.py fetch
```

## Booking Tool Tasks

The main project task is:

### 🎯 Create Booking Widget (UNL-15) - PRIORITY

A reusable booking widget package that:
- Shows a calendar with available dates (current month default)
- Displays time slots when a date is selected
- Allows customizable meeting durations (default 30 min)
- Accepts block times for busy periods
- Collects user email before submission
- Posts to configurable endpoint

**Branch:** `celorisoli/unl-15-create-booking-widget`

To work on it:
```bash
python orchestrate.py prepare 15 feature
cd ../yellow-feature
# Edit CURRENT_TASK.md with acceptance criteria
claude code
```

## Project Structure

```
workspace/
├── yellow/                          # Main repo
│   ├── apps/
│   │   └── web/                    # Next.js 16 frontend
│   ├── packages/
│   │   └── backend/                # Convex backend
│   ├── .claude/                    # Agent configuration
│   ├── orchestrate.py              # Task orchestrator (Linear integration)
│   ├── BOOKING_TOOL_README.md     # This file
│   ├── BOOKING_TOOL_SETUP.md      # Full setup guide
│   ├── BOOKING_TOOL_QUICK_START.md # Quick reference
│   └── ...
├── yellow-feature/                 # Feature development worktree
├── yellow-bugfix/                  # Bug fix development worktree
└── yellow-refactor/                # Code improvement worktree
```

## Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS, shadcn/ui
- **Backend:** Convex (BaaS), Clerk (Auth)
- **Monorepo:** Turborepo, Bun package manager
- **Code Quality:** Biome (linting/formatting), TypeScript strict mode
- **CI/CD:** GitHub + Local agents

## Development Workflow

### For a Feature Task

1. **Prepare:** `python orchestrate.py prepare 15 feature`
2. **Review:** `cat ../yellow-feature/CURRENT_TASK.md`
3. **Start:** `cd ../yellow-feature && claude code`
4. **Wait:** Agent implements and pushes
5. **Review:** Check GitHub PR
6. **Merge:** Merge when satisfied
7. **Done:** Optional - mark Linear as Done

### For a Bug Fix

Same flow, but with `bugfix`:
```bash
python orchestrate.py prepare 20 bugfix
cd ../yellow-bugfix
claude code
```

### For Code Improvements

Same flow, but with `refactor`:
```bash
python orchestrate.py prepare 25 refactor
cd ../yellow-refactor
claude code
```

## What the Agent Does

When you invoke `claude code`, the agent will:

✅ Read CURRENT_TASK.md for context
✅ Create a properly named feature/bugfix/refactor branch
✅ Implement the solution following project patterns
✅ Write tests for new functionality
✅ Run `bun run check` for linting/formatting
✅ Run type checking with `bun run check-types`
✅ Commit with proper format including LINEAR-{id}
✅ Push to GitHub
✅ Notify you to review

The agent has access to all project patterns and guidelines.

## Code Standards

All code follows these standards (enforced by agents):

- **TypeScript:** Strict mode, full type annotations
- **React:** Functional components, hooks, `"use client"` where needed
- **Components:** shadcn/ui base, TailwindCSS styling, CVA for variants
- **Backend:** Convex mutations/queries, Clerk auth integration
- **Commits:** Format: `{type}(scope): description [LINEAR-{id}]`
- **Branches:** `{type}/LINEAR-{id}-{slug}`

See `.claude/CLAUDE.md` for comprehensive linting rules.

## Environment Setup

### Required
- Node.js 20+
- Bun 1.3+ (package manager)
- `LINEAR_API_KEY` environment variable

### Optional
- Cursor IDE (for better Agent experience)
- Claude Code extension

### First Time Setup

```bash
# Clone and enter repo
git clone <repo> yellow
cd yellow

# Set Linear API key
export LINEAR_API_KEY="your_key"

# Install dependencies
bun install

# Start development
bun dev
```

## Troubleshooting

### Tasks Don't Show from Linear
1. Check API key is set: `echo $LINEAR_API_KEY`
2. Verify key is valid: Try in Linear web app settings
3. Try fetching: `python orchestrate.py fetch`
4. Check network: Linear API might be down

### Agent Didn't Push
1. Check worktree status: `python orchestrate.py status`
2. Check for uncommitted changes: `cd ../yellow-feature && git status`
3. Run linter: `bun run check`
4. Run type check: `bun run check-types`

### Merge Conflicts
1. Resolve manually in editor
2. Run `bun run check`
3. Commit: `git commit -m "merge: resolve conflicts"`
4. Push: `git push`

**For more troubleshooting:** See [BOOKING_TOOL_SETUP.md](BOOKING_TOOL_SETUP.md#troubleshooting)

## Performance Tips

- **Keep tasks focused** - Smaller tasks are faster to implement
- **Use proper types** - Specify feature/bugfix/refactor for efficiency
- **Complete context** - Fill in acceptance criteria for better implementation
- **Link dependencies** - Note related issues for context
- **Parallel work** - Use different worktrees in parallel

## Key Links

- **Linear Project:** https://linear.app/unlikely-labs/project/booking-tool-07662ae06881
- **Booking Tool Tasks:** All UNL-* issues in Linear
- **Agents:** See `.claude/FEATURE_AGENT.md`, `.claude/BUGFIX_AGENT.md`, etc.

## Team Guidelines

### For Task Creation
- Write clear descriptions with acceptance criteria
- Set git branch names in Linear (optional but helpful)
- Label tasks appropriately (feature/bug/refactor)
- Link related issues

### For Code Review
- Check branch is properly named
- Verify commit messages include LINEAR-{id}
- Review code follows project patterns
- Test locally if needed: `bun dev`

### For Maintenance
- Update agents' guides if you discover new patterns
- Share learnings in agent documentation
- Keep Linear in sync with implementation

## Future Enhancements

Possible improvements to this setup:

- [ ] Add more task types (docs, design, etc.)
- [ ] Create CLI helper for Linear API calls
- [ ] Add metrics tracking for agent performance
- [ ] Implement automatic PR creation with templates
- [ ] Add task dependency tracking
- [ ] Create dashboard showing task progress

## Questions?

1. **Quick start?** → [BOOKING_TOOL_QUICK_START.md](BOOKING_TOOL_QUICK_START.md)
2. **Full setup?** → [BOOKING_TOOL_SETUP.md](BOOKING_TOOL_SETUP.md)
3. **How it works?** → [LINEAR_INTEGRATION_SUMMARY.md](LINEAR_INTEGRATION_SUMMARY.md)
4. **Code patterns?** → [.claude/WORKFLOW.md](.claude/WORKFLOW.md)
5. **Agent details?** → [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)

## Get Started Now

```bash
# 1. Set your API key
export LINEAR_API_KEY="your_key"

# 2. See available tasks
python orchestrate.py list

# 3. Pick one and prepare it
python orchestrate.py prepare 15 feature

# 4. Let the agent work
cd ../yellow-feature && claude code

# 5. Review and merge on GitHub
```

---

**Welcome to the future of semi-autonomous development!** 🚀

Let the agents handle the implementation while you focus on architecture and review.
