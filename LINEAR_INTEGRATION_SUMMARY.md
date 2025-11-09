# Yellow Monorepo - Linear Integration Summary

This document summarizes the complete Linear integration setup for the Booking Tool project.

## What's Been Configured

### 1. Linear API Integration in orchestrate.py
- **LinearClient class** - Fetches tasks from Linear GraphQL API
- **Booking Tool Project ID** - Pre-configured (bad5da33-f38d-475a-a433-678168ee9a3c)
- **Task Fetching** - Automatically retrieves title, description, status, labels, branch names

### 2. Enhanced Task Orchestrator
The `orchestrate.py` script now:
- ✅ Lists all Booking Tool tasks from Linear (grouped by status)
- ✅ Prepares tasks with auto-fetched details from Linear
- ✅ Creates CURRENT_TASK.md files in appropriate worktrees
- ✅ Generates proper branch names (using Linear git branch if available)
- ✅ Shows worktree status and quick reference commands

### 3. Git Worktree Setup
Three independent worktrees for parallel development:
- **yellow-feature/** - For implementing features
- **yellow-bugfix/** - For fixing bugs
- **yellow-refactor/** - For code improvements

Each has its own CURRENT_TASK.md file ready for agents.

### 4. Documentation
- **BOOKING_TOOL_SETUP.md** - Complete setup and workflow guide
- **BOOKING_TOOL_QUICK_START.md** - 5-minute quick reference
- **LINEAR_INTEGRATION_SUMMARY.md** - This file

## How It Works

### Normal Workflow

```
1. Human: python orchestrate.py list
   ↓ Shows all Booking Tool tasks from Linear

2. Human: python orchestrate.py prepare 15 feature
   ↓ Fetches task details, creates CURRENT_TASK.md

3. Human: cd ../yellow-feature && claude code
   ↓ Agent reads context, implements solution

4. Agent: Creates branch, implements, commits, pushes
   ↓ Changes on GitHub

5. Human: Review PR on GitHub, merge
   ↓ Done!
```

### Data Flow

```
Linear API
    ↓
orchestrate.py (LinearClient)
    ↓
CURRENT_TASK.md (in worktree)
    ↓
Claude Code Agent
    ↓
Implementation + GitHub Push
    ↓
PR Review & Merge
```

## Task Preparation Details

When you run `python orchestrate.py prepare TASK_ID TYPE`:

### What Gets Fetched from Linear:
- Task title
- Task description
- Task status (Backlog, Todo, In Progress, Done)
- Task labels
- Git branch name (if set in Linear)
- Assignee information

### What Gets Generated:
- `CURRENT_TASK.md` - Task context file for the agent
- Branch name - Either from Linear or auto-generated from task ID + title
- Type specifics - Feature/bugfix/refactor implementation guidelines

### What Needs to Be Added:
- Acceptance criteria (copy from Linear issue details)
- Related issue links (if any)

## Configuration Required

### One-Time Setup

```bash
# Set Linear API key in your shell config
export LINEAR_API_KEY="your_linear_api_key_here"

# Verify it's set
echo $LINEAR_API_KEY
```

Get your key at: https://linear.app/account/api

### No Other Setup Needed!
- Worktrees already exist
- Branch naming conventions already configured
- Agent rules already defined
- Documentation already written

## Current Booking Tool Tasks

The Booking Tool project has these tasks tracked in Linear:

### Active
- **UNL-15** (Feature) - Create booking widget
  - Branch: celorisoli/unl-15-create-booking-widget
  - High priority - main deliverable

### Archived
- UNL-12, UNL-13, UNL-14 - Design tasks (completed/archived)

## Scripts and Tools

### orchestrate.py Commands

| Command | Purpose |
|---------|---------|
| `list` | Show Booking Tool tasks from Linear |
| `prepare TASK_ID TYPE` | Create task context in worktree |
| `status` | Show worktree and branch status |
| `fetch` | Explicitly refresh Linear tasks |

### Example Commands

```bash
# View all tasks
python orchestrate.py list

# Prepare the booking widget feature
python orchestrate.py prepare 15 feature

# Check what's been implemented
python orchestrate.py status

# Refresh task list from Linear
python orchestrate.py fetch
```

## Branch Naming Convention

Branches follow the pattern:
```
{type}/LINEAR-{id}-{description-slug}
```

Examples:
- `feature/LINEAR-15-create-booking-widget`
- `bugfix/LINEAR-20-fix-timezone-issue`
- `refactor/LINEAR-25-extract-validation`

If a git branch name is set in Linear, that will be used instead.

## Commit Message Format

Commits follow this format:
```
{type}(scope): description [LINEAR-{id}]

Optional body with implementation details.

Closes LINEAR-{id}
```

Example:
```
feature(booking): create booking widget package [LINEAR-15]

Add new booking widget package with calendar, timeslots, and email collection.
Widget can be embedded in any application and configured with custom URLs.

Closes LINEAR-15
```

## What Happens When You Invoke the Agent

When you run `cd ../yellow-feature && claude code`:

1. **Read context** - Agent reads CURRENT_TASK.md
2. **Sync branches** - `git checkout main && git pull`
3. **Create branch** - `git checkout -b feature/LINEAR-{id}-{slug}`
4. **Implement** - Write code following project patterns
5. **Test & Lint** - Run `bun run check` and type checking
6. **Commit** - Use proper commit message format with LINEAR-{id}
7. **Push** - Push to GitHub (creates PR-ready branch)
8. **Notify** - Tell you to review on GitHub

The agent has access to:
- `.claude/WORKFLOW.md` - Workflow conventions
- `.claude/FEATURE_AGENT.md` - Feature implementation patterns
- `.claude/BUGFIX_AGENT.md` - Bug fix strategies
- `.claude/REFACTOR_AGENT.md` - Refactoring patterns
- `.claude/CLAUDE.md` - Code quality and linting rules

## Integration Points

### Linear → Yellow
- Task list (via GraphQL API)
- Task details (title, description, status)
- Branch names (if set in Linear)
- Labels and assignments

### Yellow → GitHub
- Feature/bugfix/refactor branches
- Commits with LINEAR-{id} references
- PR-ready implementation

### Manual Step
- You update Linear task status after merging
- You create PRs on GitHub
- You review and merge

## Troubleshooting

### API Key Not Set
```bash
echo $LINEAR_API_KEY  # Should show your key
```

If empty, add to shell config (~/.zshrc, ~/.bashrc):
```bash
export LINEAR_API_KEY="your_key_here"
```

### Tasks Not Showing
Ensure API key is set, then run:
```bash
python orchestrate.py fetch
python orchestrate.py list
```

### Task Details Not Populated
If CURRENT_TASK.md has "[FILL IN...]" placeholders:
- API key might not be set correctly
- Linear API might be unavailable
- You can manually fill in from Linear

### Agent Didn't Create Branch
Check worktree status:
```bash
python orchestrate.py status
cd ../yellow-feature
git status
```

If changes exist but not committed, agent encountered an error. Check:
```bash
bun run check        # Lint/format errors
bun run check-types  # TypeScript errors
```

## Files Created/Modified

### New Files
- `orchestrate.py` - Enhanced with Linear integration
- `BOOKING_TOOL_SETUP.md` - Complete setup guide
- `BOOKING_TOOL_QUICK_START.md` - Quick reference
- `LINEAR_INTEGRATION_SUMMARY.md` - This file

### Modified Files
- `orchestrate.py` - Added LinearClient class and integration

### Existing Files Used
- `.claude/WORKFLOW.md` - Already has all necessary conventions
- `.claude/FEATURE_AGENT.md`, `BUGFIX_AGENT.md`, `REFACTOR_AGENT.md` - Agent guides

## Key Benefits

✅ **Automatic Task Fetching** - No manual copying from Linear
✅ **Proper Branches** - Linear git branch names used automatically
✅ **Parallel Development** - Three independent worktrees
✅ **Smart Agents** - Pre-configured for different task types
✅ **Complete Documentation** - Guides for all skill levels
✅ **Quick Start** - 5-minute setup for new tasks

## Next Steps

### For Team Leads
1. Ensure `LINEAR_API_KEY` is set in CI/CD environment
2. Share `BOOKING_TOOL_QUICK_START.md` with team
3. Ensure Linear tasks are properly formatted with acceptance criteria
4. Set git branch names in Linear issues (optional but helpful)

### For Developers
1. Set `LINEAR_API_KEY` locally
2. Read `BOOKING_TOOL_QUICK_START.md`
3. Run `python orchestrate.py list` to see tasks
4. Pick a task and run `python orchestrate.py prepare TASK_ID TYPE`
5. Follow the workflow!

### For Continuous Improvement
- Add more task types as needed (expand orchestrate.py)
- Share learnings in agent guides (.claude/*.md)
- Update Linear with branch info for future references
- Collect metrics on agent performance

## Architecture Summary

```
User Input
    ↓
orchestrate.py (Python)
    ├── Fetches from Linear API
    ├── Prepares task context
    └── Manages worktrees
    ↓
CURRENT_TASK.md
    ├── Task details from Linear
    ├── Implementation guidelines
    └── Agent instructions
    ↓
claude code (Agent)
    ├── Reads context
    ├── Creates branch
    ├── Implements solution
    ├── Runs checks
    └── Commits & pushes
    ↓
GitHub Branch
    ├── PR-ready code
    └── Proper formatting
    ↓
Human Review
    ├── Review on GitHub
    ├── Create PR
    └── Merge
```

## Questions?

- **Setup issues?** → Read `BOOKING_TOOL_SETUP.md`
- **How to start?** → Read `BOOKING_TOOL_QUICK_START.md`
- **Workflow details?** → Read `.claude/WORKFLOW.md`
- **Code patterns?** → Read `.claude/FEATURE_AGENT.md` etc.

---

**Happy shipping!** 🚀

Your repo is now fully integrated with Linear and ready for semi-autonomous development.
