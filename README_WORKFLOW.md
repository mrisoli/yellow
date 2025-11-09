# Yellow Project - Semi-Autonomous Development Workflow

Welcome! This directory contains a complete semi-autonomous task workflow for the Yellow project. You can now route Linear tasks to specialized agents that implement features, fix bugs, and refactor code—with minimal oversight from you.

## 📖 Documentation Index

Start here based on your need:

### Quick References (Start Here!)
- **[QUICK_START.md](QUICK_START.md)** - 5-minute quick reference card
- **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** - Setup summary and overview

### Comprehensive Guides
- **[WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)** - Complete workflow explanation with detailed examples

### Workflow Configuration
- **[.claude/WORKFLOW.md](.claude/WORKFLOW.md)** - Agent definitions, conventions, branch/commit rules
- **[.claude/TASK_TEMPLATE.md](.claude/TASK_TEMPLATE.md)** - Template for creating task contexts

### Agent Role Guides
Read these to understand how agents work on different task types:
- **[.claude/FEATURE_AGENT.md](.claude/FEATURE_AGENT.md)** - Building features: patterns, examples, code structure
- **[.claude/BUGFIX_AGENT.md](.claude/BUGFIX_AGENT.md)** - Fixing bugs: debugging strategies, fix patterns
- **[.claude/REFACTOR_AGENT.md](.claude/REFACTOR_AGENT.md)** - Code quality: refactoring patterns, performance optimization

### Helper Script
- **[orchestrate.py](orchestrate.py)** - Task management script
  ```bash
  python orchestrate.py list              # Show overview
  python orchestrate.py prepare ID TYPE   # Prepare task
  python orchestrate.py status            # Show status
  ```

---

## 🚀 Quick Start (60 seconds)

### 1. Prepare a Task
Get a Linear task ID and type, then run:
```bash
python orchestrate.py prepare TASK_ID TASK_TYPE
# Example: python orchestrate.py prepare 123 feature
```

### 2. Fill in Task Context
```bash
cd ../yellow-{type}
# Edit CURRENT_TASK.md with task description and acceptance criteria
# (Copy from Linear - takes 2-3 minutes)
```

### 3. Invoke Agent
```bash
claude code
# Agent implements, commits, and pushes to GitHub
```

### 4. Review & Merge
- Check the branch on GitHub
- Create PR via GitHub
- Merge when ready

---

## 📁 What Was Set Up

### Git Worktrees (3 Independent Workspaces)
```
yellow/              (main repository)
yellow-feature/      (feature/LINEAR-{id}-{slug})
yellow-bugfix/       (bugfix/LINEAR-{id}-{slug})
yellow-refactor/     (refactor/LINEAR-{id}-{slug})
```

### Three Specialized Agents
- **Feature Agent** → New features and enhancements
- **Bugfix Agent** → Bug fixes and critical issues
- **Refactor Agent** → Code quality and performance improvements

### Workflow Infrastructure
- Task context templates
- Agent role definitions
- Code style guides and patterns
- Branch/commit naming conventions
- Helper script for task management

---

## 🎯 Agent Decision Making

### What Agents Decide ✅
Agents can independently make these choices:
- Implementation approach and code structure
- Component/function API design
- Test organization and strategy
- Commit messages and branch names
- Internal refactoring to support features

### What Agents Escalate ❌
Agents ask you (via Linear comments) for:
- Unclear or contradictory requirements
- Multiple competing architectural approaches
- Breaking changes to existing APIs
- External dependencies needing approval
- Significant structural changes

---

## 📊 Your Workflow

```
Linear Task
    ↓
python orchestrate.py prepare ID TYPE
    ↓
Edit CURRENT_TASK.md (2-3 min)
    ↓
claude code in appropriate worktree
    ↓
Agent implements, commits, pushes (15-60 min)
    ↓
You review on GitHub (5-10 min)
    ↓
Merge to main
    ↓
Total time: 25-75 minutes per task
```

---

## 💡 Key Features

### Parallel Development
Work on multiple tasks simultaneously - each worktree is independent.

### Specialized Agents
Each agent type (feature/bugfix/refactor) has specific expertise and role definitions.

### Code Quality
All implementations follow project conventions, run linting/formatting checks, and include tests.

### Clear Conventions
- Branch naming: `{type}/LINEAR-{id}-{slug}`
- Commit format: `{type}(scope): description [LINEAR-{id}]`
- Clear acceptance criteria and task context

### Low Overhead
Minimal context-switching - agents handle implementation details.

---

## 📚 Document Reading Order

**First time setup:**
1. Read this file (you're here!)
2. Read [QUICK_START.md](QUICK_START.md) - 5 minutes
3. Skim [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) - 10 minutes

**Before first task:**
4. Read [.claude/WORKFLOW.md](.claude/WORKFLOW.md) - conventions
5. Read relevant agent guide (FEATURE_AGENT, BUGFIX_AGENT, or REFACTOR_AGENT)

**Reference while working:**
- [.claude/TASK_TEMPLATE.md](.claude/TASK_TEMPLATE.md) - template for task context
- Agent guides - code patterns and examples

---

## 🔧 Commands Reference

```bash
# Overview and status
python orchestrate.py list              # Show workflow status
python orchestrate.py prepare ID TYPE   # Prepare new task
python orchestrate.py status            # Show worktree status

# Navigate to worktrees
cd ../yellow-feature                    # Feature work
cd ../yellow-bugfix                     # Bugfix work
cd ../yellow-refactor                   # Refactoring work

# Invoke agents
claude code                             # In appropriate worktree

# Code quality checks
bun run check                           # Lint and format
bun run check-types                     # Type checking
bun test                                # Run tests

# Development
bun run dev                             # Full dev mode
bun run dev:web                         # Frontend only
bun run dev:server                      # Backend only
```

---

## 🎓 Learning Paths

### "I want to understand the workflow"
1. [QUICK_START.md](QUICK_START.md)
2. [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)
3. [.claude/WORKFLOW.md](.claude/WORKFLOW.md)

### "I'm about to work on a feature"
1. [QUICK_START.md](QUICK_START.md)
2. [.claude/FEATURE_AGENT.md](.claude/FEATURE_AGENT.md)
3. [.claude/TASK_TEMPLATE.md](.claude/TASK_TEMPLATE.md)

### "I'm about to work on a bugfix"
1. [QUICK_START.md](QUICK_START.md)
2. [.claude/BUGFIX_AGENT.md](.claude/BUGFIX_AGENT.md)
3. [.claude/TASK_TEMPLATE.md](.claude/TASK_TEMPLATE.md)

### "I'm about to work on a refactor"
1. [QUICK_START.md](QUICK_START.md)
2. [.claude/REFACTOR_AGENT.md](.claude/REFACTOR_AGENT.md)
3. [.claude/TASK_TEMPLATE.md](.claude/TASK_TEMPLATE.md)

---

## ❓ FAQ

**Q: Can I work on multiple tasks at the same time?**
A: Yes! Each worktree is independent. Work on feature + bugfix + refactor simultaneously.

**Q: What if the agent needs clarification?**
A: Agent adds comment to your Linear issue with specific questions.

**Q: Can I customize the workflow?**
A: Yes! Edit `.claude/WORKFLOW.md` to add custom labels, branches, or conventions.

**Q: What if something goes wrong?**
A: Check [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) troubleshooting section. Reset with `git reset --hard main`.

**Q: How much does the agent handle?**
A: Full implementation - commits with proper format, runs checks, pushes to GitHub. You handle review and merge.

**Q: What's the time savings?**
A: 25-75 minutes per task vs hours of manual work. Agent handles implementation, tests, and formatting.

---

## 📝 Example Task

**Linear Task:** Add dark mode toggle to app
**ID:** 123
**Type:** feature

```bash
# 1. Prepare
python orchestrate.py prepare 123 feature

# 2. Fill in details
cd ../yellow-feature
# Edit CURRENT_TASK.md with:
# - Title: Add dark mode toggle
# - Description: Users can toggle between light/dark theme
# - Acceptance criteria: [checkbox list from Linear]

# 3. Invoke
claude code

# 4. Wait for agent to implement (checkout GitHub meanwhile)

# 5. Review and merge
# Go to GitHub, review branch, create PR, merge
```

Done! Dark mode is now live.

---

## 🎯 Next Steps

1. **Read [QUICK_START.md](QUICK_START.md)** (5 min)
2. **Get your first Linear task**
3. **Run:** `python orchestrate.py prepare TASK_ID TASK_TYPE`
4. **Edit:** `CURRENT_TASK.md`
5. **Invoke:** `claude code`
6. **Review & merge** on GitHub

---

## 📞 Support

If you need help:
- Check [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) troubleshooting section
- Review relevant agent guide (FEATURE/BUGFIX/REFACTOR)
- Check [.claude/WORKFLOW.md](.claude/WORKFLOW.md) for conventions

---

**You're all set! Let's build something great.** 🚀
