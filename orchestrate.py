#!/usr/bin/env python3
"""
Yellow Project Task Orchestrator

Helper script to manage task routing and context preparation for semi-autonomous workflow.
Integrates with Linear API to fetch and track Booking Tool project tasks.

Usage:
    python orchestrate.py list              # List Booking Tool tasks from Linear
    python orchestrate.py prepare TASK_ID   # Prepare task context in appropriate worktree
    python orchestrate.py status            # Show worktree and branch status
    python orchestrate.py fetch             # Fetch latest Booking Tool tasks from Linear
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from typing import Optional
from datetime import datetime
import urllib.request
import urllib.error

# Configuration
PROJECT_ROOT = Path(__file__).parent
WORKSPACE_ROOT = PROJECT_ROOT.parent
WORKTREES = {
    "feature": WORKSPACE_ROOT / "yellow-feature",
    "bugfix": WORKSPACE_ROOT / "yellow-bugfix",
    "refactor": WORKSPACE_ROOT / "yellow-refactor",
}

TASK_TEMPLATE = """# Linear Task Context

**Source:** Linear Issue
**Created:** {timestamp}
**Task ID:** LINEAR-{task_id}
**Type:** {task_type}
**Worktree:** {worktree_path}

## Issue Information

**Title:** {title}

**Status:** {status}

**Labels:** {labels}

## Description

{description}

## Acceptance Criteria

{acceptance_criteria}

## Implementation Notes

### Task Type Specifics
{type_specifics}

### Related Issues/Dependencies
{related_issues}

## Agent Instructions

**Expected branch name:** {branch_name}

**Your mission:**
1. Create the branch with proper naming
2. Implement according to acceptance criteria
3. Ensure code follows project patterns
4. Run tests and `bun run check`
5. Commit with format: `{type}(scope): description [LINEAR-{task_id}]`
6. Push to GitHub
7. Done! User will handle PR review.

**Stop and update Linear issue if:**
- Requirements unclear or conflicting
- Multiple implementation approaches
- Architectural decisions needed
- Dependencies need approval

Good luck! 🚀
"""


class LinearClient:
    """Simple Linear API client."""

    def __init__(self):
        self.api_token = os.getenv("LINEAR_API_KEY")
        self.api_url = "https://api.linear.app/graphql"
        self.booking_tool_project_id = "bad5da33-f38d-475a-a433-678168ee9a3c"

    def query(self, query_str: str) -> dict:
        """Execute a GraphQL query against Linear API."""
        if not self.api_token:
            return {"error": "LINEAR_API_KEY environment variable not set"}

        try:
            request = urllib.request.Request(
                self.api_url,
                data=json.dumps({"query": query_str}).encode('utf-8'),
                headers={
                    "Authorization": self.api_token,
                    "Content-Type": "application/json",
                }
            )
            with urllib.request.urlopen(request, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.URLError as e:
            return {"error": f"Request failed: {e}"}
        except json.JSONDecodeError as e:
            return {"error": f"Failed to parse response: {e}"}

    def get_project_issues(self) -> list:
        """Fetch all issues for the Booking Tool project."""
        query = f"""
        {{
            project(id: "{self.booking_tool_project_id}") {{
                name
                issues(first: 50) {{
                    nodes {{
                        id
                        identifier
                        title
                        description
                        state {{
                            name
                        }}
                        labels {{
                            nodes {{
                                name
                            }}
                        }}
                        createdAt
                        updatedAt
                        branchName
                        assignee {{
                            name
                        }}
                    }}
                }}
            }}
        }}
        """
        return self.query(query)


class TaskOrchestrator:
    def __init__(self):
        self.project_root = PROJECT_ROOT
        self.workspace_root = WORKSPACE_ROOT
        self.linear_client = LinearClient()
        self.tasks_cache_file = PROJECT_ROOT / ".linear_tasks_cache.json"

    def run_command(self, cmd: list, cwd: Optional[Path] = None) -> tuple[str, str]:
        """Run shell command and return stdout, stderr."""
        try:
            result = subprocess.run(
                cmd,
                cwd=cwd or self.project_root,
                capture_output=True,
                text=True,
            )
            return result.stdout.strip(), result.stderr.strip()
        except Exception as e:
            return "", str(e)

    def get_worktree_path(self, task_type: str) -> Path:
        """Get worktree path for task type."""
        type_key = task_type.lower().replace("_", "").replace("-", "")

        # Flexible matching
        for key, path in WORKTREES.items():
            if key.lower() in type_key or type_key in key.lower():
                return path

        # Default to feature
        return WORKTREES["feature"]

    def list_tasks(self):
        """Show Linear Booking Tool tasks and workflow status."""
        print("\n" + "=" * 70)
        print("BOOKING TOOL PROJECT - LINEAR TASK TRACKING")
        print("=" * 70)

        # Fetch and display Linear tasks
        print("\n📋 BOOKING TOOL TASKS FROM LINEAR:")
        response = self.linear_client.get_project_issues()

        if "error" in response:
            print(f"  ⚠️  Could not fetch Linear tasks: {response['error']}")
            print("     Make sure LINEAR_API_KEY is set in your environment")
        elif "data" in response:
            try:
                project_data = response["data"]["project"]
                issues = project_data.get("issues", {}).get("nodes", [])

                if not issues:
                    print("  No issues found in Booking Tool project")
                else:
                    # Group by state
                    by_state = {}
                    for issue in issues:
                        state = issue["state"]["name"]
                        if state not in by_state:
                            by_state[state] = []
                        by_state[state].append(issue)

                    for state in ["Backlog", "Todo", "In Progress", "Done"]:
                        if state in by_state:
                            print(f"\n  {state}:")
                            for issue in by_state[state]:
                                assignee = issue.get("assignee", {})
                                assignee_name = f" [{assignee.get('name', 'unassigned')}]" if assignee else ""
                                print(f"    • {issue['identifier']}: {issue['title']}{assignee_name}")
            except (KeyError, TypeError) as e:
                print(f"  ⚠️  Error parsing Linear response: {e}")
        else:
            print("  ⚠️  Unexpected Linear API response")

        print("\n" + "-" * 70)
        print("\n📋 WORKFLOW OVERVIEW:")
        print("""
1. Pick a task from the list above
2. Run: python orchestrate.py prepare TASK_ID TYPE
   Example: python orchestrate.py prepare 15 feature
3. The script creates task context in the appropriate worktree
4. Edit the CURRENT_TASK.md file with details from Linear
5. cd to that worktree directory
6. Run: claude code (agent reads context and begins work)
7. Wait for agent to push changes to GitHub
8. Review PR and merge when satisfied
        """)

        print("\n📁 WORKTREE STATUS:")
        for wtype, wpath in WORKTREES.items():
            if wpath.exists():
                stdout, _ = self.run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"], wpath)
                print(f"  ✓ {wtype:10} → {wpath.name:20} (branch: {stdout})")
            else:
                print(f"  ✗ {wtype:10} → NOT FOUND")

        print("\n🔧 QUICK COMMANDS:")
        print(f"  Feature:  cd {WORKTREES['feature'].name} && claude code")
        print(f"  Bugfix:   cd {WORKTREES['bugfix'].name} && claude code")
        print(f"  Refactor: cd {WORKTREES['refactor'].name} && claude code")

        print("\n📚 REFERENCE:")
        print(f"  Workflow docs:  {self.project_root}/.claude/WORKFLOW.md")
        print(f"  Task template:  {self.project_root}/.claude/TASK_TEMPLATE.md")
        print(f"  Linear project: https://linear.app/unlikely-labs/project/booking-tool-07662ae06881")
        print("\n" + "=" * 70 + "\n")

    def prepare_task(self, task_id: str, task_type: str):
        """Prepare task context in appropriate worktree."""

        # Normalize type
        task_type_lower = task_type.lower().strip()
        if "feature" in task_type_lower or "enhancement" in task_type_lower:
            task_type_normalized = "feature"
        elif "bug" in task_type_lower or "fix" in task_type_lower:
            task_type_normalized = "bugfix"
        elif "refactor" in task_type_lower or "tech" in task_type_lower:
            task_type_normalized = "refactor"
        else:
            print(f"❌ Unknown task type: {task_type}")
            print("   Use: feature, bugfix, or refactor")
            return False

        worktree_path = WORKTREES[task_type_normalized]

        if not worktree_path.exists():
            print(f"❌ Worktree not found: {worktree_path}")
            return False

        # Try to fetch task details from Linear
        title = "[FILL IN: Task title from Linear]"
        description = "[FILL IN: Task description from Linear]"
        state = "TODO"
        labels = ""
        git_branch = None

        response = self.linear_client.get_project_issues()
        if "data" in response:
            try:
                issues = response["data"]["project"].get("issues", {}).get("nodes", [])
                for issue in issues:
                    if task_id.upper() in issue["identifier"].upper():
                        title = issue.get("title", title)
                        description = issue.get("description", description) or "[No description provided]"
                        state = issue.get("state", {}).get("name", state)
                        label_nodes = issue.get("labels", {}).get("nodes", [])
                        labels = ", ".join([l["name"] for l in label_nodes]) if label_nodes else ""
                        git_branch = issue.get("branchName")
                        break
            except (KeyError, TypeError):
                pass

        # Create branch name slug from task_id and title
        title_slug = title.lower().replace(" ", "-").replace(":", "")[:50] if title else task_id
        branch_name = git_branch or f"{task_type_normalized}/LINEAR-{task_id}-{title_slug}"

        # Generate task context
        timestamp = datetime.now().isoformat()

        context = TASK_TEMPLATE.format(
            timestamp=timestamp,
            task_id=task_id,
            task_type=task_type_normalized,
            worktree_path=worktree_path.name,
            title=title,
            status=state,
            labels=labels or "[No labels]",
            description=description,
            acceptance_criteria="[FILL IN: Acceptance criteria from Linear issue description or comment]",
            type_specifics=self._get_type_specifics(task_type_normalized),
            related_issues="[Check Linear issue for related/linked issues]",
            branch_name=branch_name,
            type=task_type_normalized,
        )

        # Write context to worktree
        task_file = worktree_path / "CURRENT_TASK.md"
        task_file.write_text(context)

        print(f"\n✅ Task context prepared!")
        print(f"   Worktree: {worktree_path.name}")
        print(f"   Task ID:  LINEAR-{task_id}")
        print(f"   Title:    {title}")
        print(f"   Type:     {task_type_normalized}")
        print(f"   State:    {state}")
        if labels:
            print(f"   Labels:   {labels}")
        print(f"   Context:  {task_file}")

        print(f"\n📝 NEXT STEPS:")
        print(f"   1. Review task details in: {task_file}")
        print(f"   2. Edit acceptance criteria section (copy from Linear if available)")
        print(f"   3. cd {worktree_path.name}")
        print(f"   4. claude code (let agent read CURRENT_TASK.md and begin work)")
        print()

        return True

    def _get_type_specifics(self, task_type: str) -> str:
        """Get type-specific implementation notes."""
        specifics = {
            "feature": """- Build new functionality following existing patterns
- Add components to components/ or components/ui/
- Update relevant app routes in apps/web/src/app/
- Write tests if test framework exists
- Update docs/changelog if applicable""",
            "bugfix": """- Minimize changes to fix root cause
- Add regression test
- Verify fix doesn't break other functionality
- Keep commits focused and atomic
- Document why fix was needed""",
            "refactor": """- Ensure no functional changes
- Improve code clarity/maintainability/performance
- Run full test suite before pushing
- Update related documentation
- Batch related improvements together"""
        }
        return specifics.get(task_type, "")

    def show_status(self):
        """Show current worktree and branch status."""
        print("\n📊 WORKTREE STATUS:\n")

        for wtype, wpath in WORKTREES.items():
            if not wpath.exists():
                print(f"  {wtype:10} ✗ Not found")
                continue

            # Get branch
            branch_stdout, _ = self.run_command(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                wpath
            )
            branch = branch_stdout

            # Get status
            status_stdout, _ = self.run_command(
                ["git", "status", "--short"],
                wpath
            )
            has_changes = bool(status_stdout)

            status_icon = "📝" if has_changes else "✓"
            print(f"  {wtype:10} {status_icon} {branch:20} {wpath.name}")

            if has_changes:
                print(f"             Changes: {len(status_stdout.split(chr(10)))} files")

        print()


def main():
    orchestrator = TaskOrchestrator()

    if len(sys.argv) < 2:
        orchestrator.list_tasks()
        return

    command = sys.argv[1].lower()

    if command == "list" or command == "help":
        orchestrator.list_tasks()
    elif command == "prepare":
        if len(sys.argv) < 4:
            print("Usage: python orchestrate.py prepare TASK_ID TASK_TYPE")
            print("Example: python orchestrate.py prepare 15 feature")
            return
        task_id = sys.argv[2]
        task_type = sys.argv[3]
        orchestrator.prepare_task(task_id, task_type)
    elif command == "status":
        orchestrator.show_status()
    elif command == "fetch":
        print("\n🔄 Fetching latest Booking Tool tasks from Linear...")
        response = orchestrator.linear_client.get_project_issues()
        if "data" in response:
            try:
                project_name = response["data"]["project"]["name"]
                issues = response["data"]["project"].get("issues", {}).get("nodes", [])
                print(f"✅ Fetched {len(issues)} issues from {project_name}")
                print("\n   Run: python orchestrate.py list")
                print("   to see the updated task list")
            except (KeyError, TypeError) as e:
                print(f"❌ Error: {e}")
        else:
            error = response.get("error", "Unknown error")
            print(f"❌ Failed to fetch: {error}")
    else:
        print(f"Unknown command: {command}")
        orchestrator.list_tasks()


if __name__ == "__main__":
    main()
