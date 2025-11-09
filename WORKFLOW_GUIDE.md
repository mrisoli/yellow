# Yellow Project - Semi-Autonomous Task Workflow Guide

Welcome! This guide explains how to use the semi-autonomous workflow for efficient task management and implementation.

## What You Have

### 📁 Git Worktrees (Already Set Up)

Three independent git worktrees for parallel work:

```
yellow-feature    # Feature branch: feature/LINEAR-{id}-{slug}
yellow-bugfix     # Bugfix branch:  bugfix/LINEAR-{id}-{slug}
yellow-refactor   # Refactor branch: refactor/LINEAR-{id}-{slug}
```

Each worktree is independent - you can work on multiple tasks simultaneously.

### 📚 Documentation Files

| File | Purpose |
|------|---------|
| `.claude/WORKFLOW.md` | Core workflow definitions (agent specializations, conventions) |
| `.claude/FEATURE_AGENT.md` | Feature agent role, patterns, and examples |
| `.claude/BUGFIX_AGENT.md` | Bugfix agent role, patterns, and debugging approaches |
| `.claude/REFACTOR_AGENT.md` | Refactor agent role, patterns, and refactoring examples |
| `.claude/TASK_TEMPLATE.md` | Template for task context (fill in before invoking agent) |
| `orchestrate.py` | Helper script to prepare tasks and show status |

### 🤖 Agent Specializations

**Feature Agent** (worktree-feature)
- New features and enhancements
- Follow existing patterns
- Write tests for new code
- Can decide implementation independently

**Bugfix Agent** (worktree-bugfix)
- Fix reported bugs with minimal changes
- Write regression tests
- Root cause analysis
- Keep fixes focused and atomic

**Refactor Agent** (worktree-refactor)
- Improve code quality without changing behavior
- Extract components and utilities
- Performance optimizations
- Reduce duplication

## Quick Start Workflow

### Step 1: Check Available Tasks

```bash
python orchestrate.py list
```

Shows worktree status and available commands.

### Step 2: Prepare Task

Get a Linear task ID and type, then prepare the context:

```bash
python orchestrate.py prepare TASK_ID TASK_TYPE
# Example:
python orchestrate.py prepare 123 feature
```

This creates `CURRENT_TASK.md` in the appropriate worktree.

### Step 3: Fill in Task Details

Edit the generated `CURRENT_TASK.md` file in the worktree with:
- Task title and description (from Linear)
- Acceptance criteria (from Linear)
- Any related issues or dependencies
- Type-specific notes (features/tests/documentation)

**Time to fill in:** 2-3 minutes (copy-paste from Linear)

### Step 4: Invoke Agent

```bash
cd ../yellow-feature  # (or yellow-bugfix, yellow-refactor)
claude code
```

The agent will:
1. Read CURRENT_TASK.md to understand the task
2. Create a feature branch following naming conventions
3. Implement the solution
4. Run checks and tests
5. Commit with proper format including LINEAR-{id}
6. Push to GitHub

**Time for agent to work:** Varies by task complexity (minutes to hours)

### Step 5: Review and Merge

Once the agent finishes (and pushes to GitHub):
1. Review the created branch on GitHub
2. Run `bun run dev` locally to test if needed
3. Create a PR via GitHub interface
4. Merge when satisfied

### Step 6: Update Linear (Optional)

Mark the Linear task as Done after merging.

---

## Detailed Workflow

### Understanding Task Types

#### Feature Tasks
- **Use case:** "Add dark mode toggle", "Create user profile page", "Add todo filtering"
- **Agent:** Feature agent in yellow-feature worktree
- **Output:** New code, new components, new pages
- **Testing:** Includes new tests
- **Complexity:** Medium to High

#### Bugfix Tasks
- **Use case:** "Todos not saving", "Login button broken", "Performance issue"
- **Agent:** Bugfix agent in yellow-bugfix worktree
- **Output:** Fixed code, regression test
- **Testing:** Minimal, focused fix
- **Complexity:** Low to Medium

#### Refactor Tasks
- **Use case:** "Simplify todo component", "Extract validation logic", "Improve query performance"
- **Agent:** Refactor agent in yellow-refactor worktree
- **Output:** Improved code, same functionality
- **Testing:** Verify no behavior changes
- **Complexity:** Low to Medium

### What Goes in CURRENT_TASK.md

The agent reads this file to understand what to implement. Fill it with:

```markdown
# Linear Task Context

**Task ID:** LINEAR-123
**Type:** feature
**Worktree:** yellow-feature

## Issue Information

**Title:** Add due date support to todos

**Status:** TODO

**Labels:** feature, enhancement

## Description

[Copy full description from Linear]

## Acceptance Criteria

- [ ] User can set due date when creating todo
- [ ] Due date is optional
- [ ] Due date displays in user's timezone
- [ ] Can edit due date on existing todos
- [ ] Due date appears in todo list view

## Implementation Notes

### Task Type Specifics
- Build new UI component for date picker
- Extend todo schema to include due_date field
- Add Convex mutation to update todos with dates
- Write tests for date handling

### Related Issues
- LINEAR-45: Date picker component design

## Agent Instructions

**Expected branch name:** feature/LINEAR-123-add-due-dates

Your mission:
1. Implement date picker component
2. Update todo data model
3. Add frontend integration
4. Write tests
5. Commit and push

Good luck!
```

That's it - the agent takes it from there.

### Agent Workflow (What Happens)

Once you invoke the agent in a worktree with CURRENT_TASK.md:

1. **Read context** - Agent reads CURRENT_TASK.md
2. **Sync with main** - `git checkout main && git pull`
3. **Create branch** - `git checkout -b feature/LINEAR-{id}-{slug}`
4. **Implement** - Write code, create files, modify as needed
5. **Follow patterns** - Match existing code style (agent has guides)
6. **Write tests** - Add tests for new functionality
7. **Check quality** - Run `bun run check` and `bun run check-types`
8. **Test manually** - Verify in dev mode if needed
9. **Commit** - Format: `feature(scope): description [LINEAR-{id}]`
10. **Push** - Create remote branch on GitHub
11. **Done** - Notifies you to review

### Branch Naming Convention

All branches follow this pattern:

```
{type}/LINEAR-{id}-{slug}
```

- **type:** feature, bugfix, or refactor
- **id:** Linear task ID (number)
- **slug:** Kebab-case description (2-4 words)

Examples:
- `feature/LINEAR-123-user-authentication`
- `bugfix/LINEAR-45-fix-todo-completion`
- `refactor/LINEAR-67-extract-api-utilities`

### Commit Message Format

All commits follow this format:

```
{type}(scope): description [LINEAR-{id}]

Optional body with details about implementation.

Closes LINEAR-{id}
```

Example:
```
feature(todos): add due date support [LINEAR-123]

Users can set optional due dates on todos.
Dates display in user's local timezone.
Added date picker component and Convex mutations.

Closes LINEAR-123
```

---

## Parallel Work Examples

You can work on multiple tasks simultaneously in different worktrees:

```bash
# Terminal 1 - Feature work
cd ../yellow-feature
cat CURRENT_TASK.md  # Review task
claude code

# Terminal 2 - Meanwhile, bugfix work (while feature agent works)
cd ../yellow-bugfix
cat CURRENT_TASK.md
claude code

# Terminal 3 - Check progress
python orchestrate.py status
```

Each worktree is independent - no conflicts or interference.

---

## Agent Decision Making

### What Agents Decide Independently ✅

Agents can make these decisions without asking:

- **Implementation approach** (when valid options exist)
- **Code structure** (files to create/modify)
- **Component/function design** (APIs, parameters)
- **Internal refactoring** (how to organize code)
- **Test structure** (what to test, how)
- **Commit messages** (exact wording)
- **Branch names** (slug naming)

### What Agents Escalate ❌

Agents should ask you (update Linear issue) if:

- **Requirements unclear** - Description is vague or contradictory
- **Multiple approaches** - Conflicting tradeoffs (speed vs quality)
- **Affects other systems** - Changes ripple to multiple features
- **Breaking changes** - Would break existing functionality
- **External dependencies** - Needs packages not in project
- **Architectural decisions** - Major structural changes
- **Performance tradeoffs** - Speed vs simplicity unclear

When agents escalate, they'll add a comment to your Linear issue with specific questions.

---

## Code Style Quick Reference

### TypeScript/React
- Use `"use client"` for client components
- Type all function parameters and returns
- Use interfaces for prop types
- Prefer composition over inheritance

### Components
- Place UI primitives in `components/ui/`
- Feature components in `components/`
- Use CVA for component variants
- Export component and Props interface

### Styling
- TailwindCSS utilities
- `clsx` for conditions
- `tailwind-merge` for merging classes
- Dark mode: `dark:` prefix

### Files
- Kebab-case: `my-component.tsx`
- camelCase: functions and variables
- PascalCase: components and classes

### Testing
- Descriptive test names
- Test happy path + edge cases
- Use existing test framework
- Aim for high coverage on critical code

---

## Troubleshooting

### Agent Didn't Push?
Check the worktree for uncommitted changes:

```bash
cd ../yellow-feature
git status
```

If there are changes, the agent likely encountered an error. Check:
1. Type errors: `bun run check-types`
2. Linting errors: `bun run check`
3. Test failures: `bun test`

### Merge Conflicts?
If multiple agents push to same files simultaneously:

```bash
cd ../yellow-feature
git status  # See conflicts
# Resolve conflicts manually
bun run check  # Format and lint
git add .
git commit -m "merge: resolve conflicts"
git push
```

### Need to Abort Task?
If mid-implementation, you want to stop:

```bash
cd ../yellow-feature
git reset --hard main  # Discard all changes
git checkout main
git branch -D worktree/feature
git worktree remove ../yellow-feature
git worktree add ../yellow-feature -b worktree/feature
```

---

## Performance Tips

### Working on Multiple Tasks
- Use separate worktrees to avoid switching branches
- Each terminal can work independently
- No conflicts between feature/bugfix/refactor agents

### Faster Implementation
- Fill in CURRENT_TASK.md completely
- Include acceptance criteria (not assumptions)
- Link related Linear issues
- Specify if tests are expected

### Faster Review
- Test locally before creating PR: `bun run dev`
- Check the branch diff on GitHub before reviewing
- Ask agent to add documentation if complex

---

## Advanced Usage

### Custom Task Labels

If you use custom Linear labels, update `.claude/WORKFLOW.md` task label mapping:

```markdown
| Linear Label | Agent Type | Worktree | Priority |
|---|---|---|---|
| `type:feature` | Feature | yellow-feature | Standard |
| `custom:label` | Feature | yellow-feature | Standard |
```

### Agent Customization

Each agent has a detailed guide:
- `.claude/FEATURE_AGENT.md` - 50+ patterns and examples
- `.claude/BUGFIX_AGENT.md` - Debugging and fix strategies
- `.claude/REFACTOR_AGENT.md` - Refactoring patterns

Feel free to extend these guides with project-specific patterns.

### Helper Script Options

```bash
# Show workflow overview and status
python orchestrate.py list

# Prepare new task (creates CURRENT_TASK.md)
python orchestrate.py prepare TASK_ID TYPE
python orchestrate.py prepare 123 feature

# Show worktree branches and changes
python orchestrate.py status

# Get help
python orchestrate.py help
```

---

## Summary

**Your new workflow:**

1. Get Linear task (feature/bugfix/refactor)
2. Run `python orchestrate.py prepare TASK_ID TYPE`
3. Fill in `CURRENT_TASK.md` with details (2-3 min)
4. `cd ../yellow-{type} && claude code`
5. Wait for agent to implement and push
6. Review on GitHub, create PR, merge
7. Done!

**Time breakdown:**
- Task prep: 2-3 minutes
- Agent work: 15-60 minutes (depending on complexity)
- Your review: 5-10 minutes
- **Total: 25-75 minutes per task** (vs hours of manual work)

---

## Next Steps

1. **Review the agent guides** - `.claude/FEATURE_AGENT.md`, etc.
2. **Check workflow definitions** - `.claude/WORKFLOW.md`
3. **Get your first Linear task**
4. **Run:** `python orchestrate.py prepare TASK_ID TYPE`
5. **Invoke:** `claude code` in appropriate worktree
6. **Let the agent work!**

Happy shipping! 🚀
