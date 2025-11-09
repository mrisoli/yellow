# Semi-Autonomous Task Workflow

This document defines how tasks are routed, implemented, and tracked in the Yellow project using specialized agents.

## Agent Specializations

### Feature Agent (worktree-feature)
**Handles:** New features, enhancements, feature flags
**Responsibilities:**
- Implement new functionality
- Extend existing features
- Add new components or pages
- Create feature branches: `feature/LINEAR-{id}-{slug}`
- Write tests for new functionality
- Update documentation

**Decision Authority:**
- Choose implementation patterns matching existing code style
- Refactor internal code to support features
- Add dependencies if justified and approved

**Escalation Points:**
- Major architectural changes
- Changes affecting multiple systems
- Breaking API changes

### Bugfix Agent (worktree-bugfix)
**Handles:** Bug fixes, critical issues, hotfixes
**Responsibilities:**
- Fix reported bugs
- Address security issues
- Handle regressions
- Create bugfix branches: `bugfix/LINEAR-{id}-{slug}`
- Add regression tests
- Keep commits atomic and focused

**Decision Authority:**
- Choose minimal fix vs refactoring fix
- Backport decisions for multi-version systems
- Performance optimizations in fix scope

**Escalation Points:**
- Unclear root cause after investigation
- Fix requires design decisions
- Multiple components affected

### Refactor Agent (worktree-refactor)
**Handles:** Technical debt, performance improvements, code quality
**Responsibilities:**
- Refactor existing code for clarity/maintainability
- Optimize performance bottlenecks
- Update deprecated patterns
- Create refactor branches: `refactor/LINEAR-{id}-{slug}`
- Ensure no behavioral changes
- Run full test suite before pushing

**Decision Authority:**
- Choose refactoring approach
- Batch related cleanup work
- Update tools/configs

**Escalation Points:**
- Functional behavior changes required
- Uncertain about performance impact
- Large codebase rewrites

## Task Label Mapping

| Linear Label | Agent Type | Worktree | Priority |
|------------|-----------|----------|----------|
| `type:feature` or `type:enhancement` | Feature | yellow-feature | Standard |
| `type:bug` or `type:critical` | Bugfix | yellow-bugfix | High |
| `type:refactor` or `type:tech-debt` | Refactor | yellow-refactor | Standard |
| `priority:urgent` | - | Bugfix first | Urgent |

## Branch Naming Convention

```
{type}/LINEAR-{issue-id}-{description-slug}
```

**Examples:**
- `feature/LINEAR-123-user-authentication`
- `bugfix/LINEAR-45-fix-todo-completion`
- `refactor/LINEAR-67-extract-api-utilities`

## Commit Message Format

```
{type}(scope): description [LINEAR-{id}]

Optional body with implementation details or testing notes.
```

**Examples:**
```
feature(todos): add due date support [LINEAR-123]

Users can now set optional due dates on todos.
Dates are displayed in user's local timezone.

Closes LINEAR-123
```

```
bugfix(auth): fix token refresh on network reconnect [LINEAR-45]

Token was not being refreshed when network reconnected.
Added explicit refresh trigger on connection restore.

Closes LINEAR-45
```

## Workflow Steps

### 1. Task Selection (You)
- Review Linear assigned tasks
- Choose a task to work on
- Note the Linear issue ID and type (feature/bugfix/refactor)

### 2. Context Preparation (You)
- Copy task details (title, description, acceptance criteria)
- Create `CURRENT_TASK.md` in appropriate worktree (or use helper script)
- Note any linked issues or dependencies

### 3. Agent Invocation (You)
```bash
cd /path/to/worktree
claude code --task LINEAR-123
```

Or with pre-created context:
```bash
cd /path/to/worktree
# Agent reads CURRENT_TASK.md and begins work
claude code
```

### 4. Implementation (Agent)
- Read task context from Linear/CURRENT_TASK.md
- Create feature/bugfix/refactor branch with proper naming
- Implement solution following code patterns
- Write/update tests
- Run linting/formatting checks (`bun run check`)
- Commit with proper format including LINEAR-{id}
- Push to GitHub

### 5. Your Review
- Review the pushed branch on GitHub
- Run `bun run dev` to test locally if needed
- Create PR with GitHub's PR interface
- Merge when satisfied

### 6. Task Closure (You)
- Mark Linear task as Done
- Monitor for feedback/issues

## Code Style & Patterns to Follow

### TypeScript/Next.js
- Use `"use client"` directive for client components
- Prefer composition over inheritance
- Use React hooks for state management
- Follow Next.js app router conventions
- Type all function parameters and returns

### Component Development
- Use CVA (Class Variance Authority) for component variants
- Place UI primitives in `components/ui/`
- Place feature components in `components/`
- Use Radix UI as headless component base
- Export component and component Props interface

### Styling
- Use TailwindCSS utility classes
- Use `clsx` for conditional classes
- Use `tailwind-merge` for class merging in variants
- Follow Biome's CSS sorting rules
- Dark mode support via `next-themes`

### Backend (Convex)
- Use typed arguments with Convex `v.*()` validators
- Queries for reads, mutations for writes
- Follow Convex auth patterns with Clerk
- Document function parameters and return types

### Testing
- Write tests for complex business logic
- Use existing test framework (TBD - setup needed)
- Aim for high coverage on critical paths
- Test both happy path and error cases

### Code Quality
- Run `bun run check` before committing
- Biome handles linting and formatting
- Fix any type errors: `bun run check-types`
- Follow naming conventions (kebab-case files, camelCase functions)

## Decision Making Without Clarification

These decisions can be made autonomously:

✅ **Can decide without asking:**
- Which files to modify/create to implement feature
- Component/function API design (within scope)
- Internal refactoring to support feature
- Test structure and organization
- Code formatting/style (Biome enforces)
- Commit message wording
- Branch names and structure

❌ **Must ask/escalate (update Linear issue):**
- Unclear acceptance criteria or requirements
- Multiple implementation approaches with different tradeoffs
- Changes that affect multiple features
- Breaking changes to existing APIs
- Performance vs simplicity tradeoffs unclear
- Whether to add external dependencies
- Significant architectural decisions

## Error Handling

### Merge Conflicts
1. Resolve conflicts locally
2. Run `bun run check` to ensure quality
3. Commit merge resolution
4. Push resolved branch

### Test Failures
1. Analyze test output
2. Fix implementation or test
3. Update commit with fixes
4. Document in PR if needed

### Missing Dependencies
1. Install with appropriate package manager (Bun)
2. Document why added in commit/PR
3. Proceed with implementation

### Unclear Requirements
1. Update Linear issue with specific questions
2. Wait for clarification
3. Continue with other assigned tasks

## Automation Notes

- Each worktree is independent (no conflicts between agent types)
- Multiple tasks can be in progress simultaneously in different worktrees
- Always sync with main before creating feature branch
- Always push to GitHub (creates remote branch if needed)
- Leave Linear status updates to you for now (maintain visibility)
