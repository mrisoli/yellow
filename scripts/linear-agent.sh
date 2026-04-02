#!/usr/bin/env bash
# =============================================================================
# linear-agent.sh
#
# Polls Linear for "Backlog" and "Todo" issues and automatically:
#   1. Creates a feature branch
#   2. Runs Claude to implement the changes
#   3. Opens a GitHub PR via the GitHub REST API
#   4. Enables auto-merge (merges when CI passes)
#   5. Updates the Linear issue status + adds a comment
#
# If there are no Backlog/Todo issues, it scans open PRs for failing CI checks
# and runs Claude to fix any errors it finds.
#
# Prerequisites:
#   - LINEAR_API_KEY  — from Linear Settings › API › Personal API keys
#   - GH_TOKEN        — GitHub personal access token (repo + pull_request scopes)
#   - claude          — Claude CLI in PATH
#   - jq              — JSON processor (`brew install jq`)
#   - git             — with SSH/HTTPS credentials for the repo
#
# Credentials can be provided via environment variables OR a .env file at
# scripts/.env (this file is gitignored — never commit credentials):
#
#   LINEAR_API_KEY=lin_api_...
#   GH_TOKEN=ghp_...
#
# Usage:
#   bash scripts/linear-agent.sh
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — edit GITHUB_REPO if you fork or rename the project
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"
GITHUB_REPO="mrisoli/yellow"
BASE_BRANCH="main"

# Linear workspace constants
LINEAR_TEAM_ID="c4962e7a-41a8-4ec7-b5ea-53fa2a4a1e92"
LINEAR_BACKLOG_STATUS_ID="f16554f0-df64-4890-8cf1-4818781d2eb0"
LINEAR_TODO_STATUS_ID="782868c7-efb7-4455-91a7-29ae591dc15d"
LINEAR_IN_PROGRESS_STATUS_ID="b9bd611c-b7a2-4561-81ca-4e9f53be5b94"
LINEAR_IN_REVIEW_STATUS_ID="2bb1c368-181c-49be-9ff4-68d330a0f179"

LINEAR_API_URL="https://api.linear.app/graphql"
GITHUB_API_URL="https://api.github.com"

# ---------------------------------------------------------------------------
# Load .env file if present (allows sandbox / CI use without shell exports)
# ---------------------------------------------------------------------------
ENV_FILE="$SCRIPT_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log()  { echo "$(date '+%H:%M:%S') $*"; }
info() { log "  ℹ $*"; }
ok()   { log "  ✓ $*"; }
err()  { log "  ✗ $*" >&2; }

check_prereqs() {
  local missing=()
  [[ -z "${LINEAR_API_KEY:-}" ]] && missing+=("LINEAR_API_KEY (export it, add to ~/.zshrc, or put it in scripts/.env)")
  [[ -z "${GH_TOKEN:-}" ]]       && missing+=("GH_TOKEN (export it, add to ~/.zshrc, or put it in scripts/.env)")
  command -v claude &>/dev/null || missing+=("claude CLI  — https://claude.ai/code")
  command -v jq     &>/dev/null || missing+=("jq  — brew install jq")
  command -v git    &>/dev/null || missing+=("git")

  if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing prerequisites:"
    for item in "${missing[@]}"; do
      err "  • $item"
    done
    exit 1
  fi

  # Verify GitHub token works
  local gh_user
  gh_user=$(curl -sf -H "Authorization: Bearer $GH_TOKEN" \
    "$GITHUB_API_URL/user" | jq -r '.login' 2>/dev/null || true)
  if [[ -z "$gh_user" ]]; then
    err "GH_TOKEN does not appear to be valid — check that it has repo + pull_requests scopes"
    exit 1
  fi
  info "GitHub authenticated as: $gh_user"
}

# Execute a Linear GraphQL request
linear_gql() {
  curl -sf -X POST "$LINEAR_API_URL" \
    -H "Authorization: $LINEAR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$1"
}

# Fetch all issues in "Backlog" or "Todo" state for the configured team
get_actionable_issues() {
  linear_gql "$(jq -n \
    --arg teamId      "$LINEAR_TEAM_ID" \
    --arg backlogId   "$LINEAR_BACKLOG_STATUS_ID" \
    --arg todoId      "$LINEAR_TODO_STATUS_ID" \
    '{
      query: "query GetActionable($teamId: ID!, $backlogId: ID!, $todoId: ID!) { issues(filter: { team: { id: { eq: $teamId } }, state: { id: { in: [$backlogId, $todoId] } } }) { nodes { id identifier title description } } }",
      variables: { teamId: $teamId, backlogId: $backlogId, todoId: $todoId }
    }')"
}

# Move a Linear issue to a new status
set_issue_status() {
  local issue_id="$1" status_id="$2"
  linear_gql "$(jq -n \
    --arg id      "$issue_id" \
    --arg stateId "$status_id" \
    '{
      query: "mutation SetStatus($id: String!, $stateId: String!) { issueUpdate(id: $id, input: { stateId: $stateId }) { success } }",
      variables: { id: $id, stateId: $stateId }
    }')" >/dev/null
}

# Post a comment on a Linear issue
add_linear_comment() {
  local issue_id="$1" body="$2"
  linear_gql "$(jq -n \
    --arg issueId "$issue_id" \
    --arg body    "$body" \
    '{
      query: "mutation AddComment($issueId: String!, $body: String!) { commentCreate(input: { issueId: $issueId, body: $body }) { success } }",
      variables: { issueId: $issueId, body: $body }
    }')" >/dev/null
}

# Create a GitHub PR via REST API — prints the PR URL
github_create_pr() {
  local branch="$1" title="$2" body="$3"
  curl -sf \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$GITHUB_API_URL/repos/$GITHUB_REPO/pulls" \
    -d "$(jq -n \
      --arg title "$title" \
      --arg body  "$body" \
      --arg head  "$branch" \
      --arg base  "$BASE_BRANCH" \
      '{title: $title, body: $body, head: $head, base: $base}')" \
  | jq -r '.html_url'
}

# Enable auto-merge on a PR (requires the repo to have auto-merge enabled in Settings)
github_enable_automerge() {
  local pr_node_id="$1"
  # GraphQL mutation — REST doesn't expose auto-merge
  curl -sf \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.github.com/graphql" \
    -d "$(jq -n \
      --arg prId "$pr_node_id" \
      '{
        query: "mutation($prId: ID!) { enablePullRequestAutoMerge(input: { pullRequestId: $prId, mergeMethod: SQUASH }) { pullRequest { autoMergeRequest { enabledAt } } } }",
        variables: { prId: $prId }
      }')" >/dev/null 2>&1 || true
  # Non-fatal: auto-merge may not be enabled on the repo — the PR is still created
}

# Build a safe git branch name from issue identifier + title
make_branch_name() {
  local identifier="$1" title="$2"
  local id_lower slug
  id_lower=$(echo "$identifier" | tr '[:upper:]' '[:lower:]')
  slug=$(echo "$title" \
    | tr '[:upper:]' '[:lower:]' \
    | tr -cs 'a-z0-9' '-' \
    | sed 's/-$//' \
    | cut -c1-45)
  echo "feat/${id_lower}-${slug}"
}

# ---------------------------------------------------------------------------
# Core: process one Linear issue
# ---------------------------------------------------------------------------
process_issue() {
  local issue_id="$1"
  local identifier="$2"
  local title="$3"
  local description="$4"

  local branch
  branch=$(make_branch_name "$identifier" "$title")

  log "━━━ $identifier: $title"
  info "Branch → $branch"

  # ── Guard: skip if the branch is already on the remote ──────────────────
  if git -C "$REPO_PATH" ls-remote --heads origin "$branch" 2>/dev/null | grep -q .; then
    info "Branch already exists remotely — skipping (already in progress)"
    return 0
  fi

  # ── Mark In Progress ─────────────────────────────────────────────────────
  set_issue_status "$issue_id" "$LINEAR_IN_PROGRESS_STATUS_ID"
  info "Linear status → In Progress"

  # ── Prepare a clean branch from main ─────────────────────────────────────
  # Configure git to use GH_TOKEN for HTTPS authentication
  git -C "$REPO_PATH" config credential.helper "store" 2>/dev/null || true
  printf 'https://%s:x-oauth-basic@github.com\n' "$GH_TOKEN" \
    > "$HOME/.git-credentials" 2>/dev/null || true

  git -C "$REPO_PATH" fetch origin "$BASE_BRANCH" --quiet
  git -C "$REPO_PATH" checkout "$BASE_BRANCH" --quiet
  git -C "$REPO_PATH" reset --hard "origin/$BASE_BRANCH" --quiet
  git -C "$REPO_PATH" checkout -b "$branch"
  info "Branch created from origin/$BASE_BRANCH"

  # ── Build the implementation prompt ──────────────────────────────────────
  local prompt
  prompt=$(cat <<PROMPT
You are implementing a Linear issue in a TypeScript monorepo (Next.js · Convex · Better Auth).

## Issue
- ID: ${identifier}
- Title: ${title}
- Description:
$(echo "${description}" | head -c 3000)

## Repository
- Path: ${REPO_PATH}
- Active branch: ${branch}  ← already checked out, do NOT switch branches

## Steps (execute in order)
1. Read \`${REPO_PATH}/AGENTS.md\` for project coding standards and conventions.
2. Explore the codebase — look at \`${REPO_PATH}/apps/\` and \`${REPO_PATH}/packages/\` to understand the structure.
3. Implement the feature or fix described in the issue. Follow the Ultracite/Biome code standards.
4. Auto-fix linting: \`cd ${REPO_PATH} && bun x ultracite fix\`
5. Check types: \`cd ${REPO_PATH} && bun run check-types\` — fix any type errors before continuing.
6. Stage and commit: \`cd ${REPO_PATH} && git add -A && git commit -m "feat(${identifier}): ${title}"\`
7. Push the branch: \`cd ${REPO_PATH} && git push origin ${branch}\`

## Constraints
- Do NOT create a pull request — just implement, commit, and push.
- Keep changes focused on what the issue describes.
- Ensure all code is type-safe and follows the patterns already in the codebase.
PROMPT
)

  # ── Run Claude to implement ───────────────────────────────────────────────
  info "Running Claude to implement (this may take a few minutes)…"
  if ! claude \
      --permission-mode bypassPermissions \
      --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
      -p "$prompt"; then
    err "Claude failed to implement $identifier"
    git -C "$REPO_PATH" checkout "$BASE_BRANCH" --quiet
    git -C "$REPO_PATH" branch -D "$branch" 2>/dev/null || true
    set_issue_status "$issue_id" "$LINEAR_TODO_STATUS_ID"
    return 1
  fi

  # ── Verify the branch was actually pushed ─────────────────────────────────
  if ! git -C "$REPO_PATH" ls-remote --heads origin "$branch" 2>/dev/null | grep -q .; then
    err "Branch was not pushed for $identifier — Claude may not have completed the commit/push step"
    git -C "$REPO_PATH" checkout "$BASE_BRANCH" --quiet
    set_issue_status "$issue_id" "$LINEAR_TODO_STATUS_ID"
    return 1
  fi
  ok "Branch pushed"

  # ── Open the PR via GitHub REST API ──────────────────────────────────────
  local pr_body pr_url pr_number
  pr_body="$(cat <<BODY
## Linear Issue

**[${identifier}](https://linear.app/issue/${identifier})**: ${title}

## Summary

${description}

---
🤖 Implemented automatically by Claude — auto-merge is enabled and will trigger once CI passes.
BODY
)"

  pr_url=$(github_create_pr "$branch" "feat(${identifier}): ${title}" "$pr_body")
  if [[ -z "$pr_url" ]]; then
    err "Failed to create PR for $identifier"
    set_issue_status "$issue_id" "$LINEAR_TODO_STATUS_ID"
    return 1
  fi
  info "PR opened: $pr_url"

  # Extract PR number and enable auto-merge (best-effort)
  pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$' || true)
  if [[ -n "$pr_number" ]]; then
    # Get the node ID needed for the GraphQL auto-merge mutation
    local pr_node_id
    pr_node_id=$(curl -sf \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      "$GITHUB_API_URL/repos/$GITHUB_REPO/pulls/$pr_number" \
      | jq -r '.node_id' 2>/dev/null || true)
    [[ -n "$pr_node_id" ]] && github_enable_automerge "$pr_node_id"
    ok "Auto-merge requested"
  fi

  # ── Update Linear ─────────────────────────────────────────────────────────
  set_issue_status "$issue_id" "$LINEAR_IN_REVIEW_STATUS_ID"
  add_linear_comment "$issue_id" \
    "🤖 PR opened automatically: ${pr_url} — auto-merge is enabled and will trigger once CI passes."
  ok "Linear updated → In Review"
}

# ---------------------------------------------------------------------------
# Fallback: fix failing CI on open PRs
# ---------------------------------------------------------------------------

# Returns a JSON array of open PRs: [{number, title, head_ref, node_id}]
get_open_prs() {
  curl -sf \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$GITHUB_API_URL/repos/$GITHUB_REPO/pulls?state=open&per_page=50"
}

# Prints "failing" if the latest commit on $branch has any failed check runs,
# "pending" if checks are still running, or "passing" otherwise.
get_pr_ci_status() {
  local branch="$1"
  local sha
  sha=$(curl -sf \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "$GITHUB_API_URL/repos/$GITHUB_REPO/branches/$branch" \
    | jq -r '.commit.sha' 2>/dev/null || true)

  [[ -z "$sha" ]] && { echo "unknown"; return; }

  local check_runs
  check_runs=$(curl -sf \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "$GITHUB_API_URL/repos/$GITHUB_REPO/commits/$sha/check-runs" \
    | jq '.check_runs' 2>/dev/null || echo "[]")

  local total failed in_progress
  total=$(echo "$check_runs" | jq 'length')
  failed=$(echo "$check_runs" | jq '[.[] | select(.conclusion == "failure" or .conclusion == "timed_out")] | length')
  in_progress=$(echo "$check_runs" | jq '[.[] | select(.status == "in_progress" or .status == "queued")] | length')

  if [[ "$total" -eq 0 ]]; then
    echo "no_checks"
  elif [[ "$failed" -gt 0 ]]; then
    echo "failing"
  elif [[ "$in_progress" -gt 0 ]]; then
    echo "pending"
  else
    echo "passing"
  fi
}

# Gets a summary of failing check names and their output for a branch
get_failing_checks_summary() {
  local branch="$1"
  local sha
  sha=$(curl -sf \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "$GITHUB_API_URL/repos/$GITHUB_REPO/branches/$branch" \
    | jq -r '.commit.sha' 2>/dev/null || true)

  [[ -z "$sha" ]] && { echo "Could not resolve branch SHA"; return; }

  curl -sf \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "$GITHUB_API_URL/repos/$GITHUB_REPO/commits/$sha/check-runs" \
    | jq -r '
      .check_runs[]
      | select(.conclusion == "failure" or .conclusion == "timed_out")
      | "  Check: \(.name)\n  Conclusion: \(.conclusion)\n  Details: \(.output.summary // "(no summary)")\n"
    ' 2>/dev/null || echo "(could not fetch check details)"
}

# Checks out a PR branch, runs Claude to fix CI errors, pushes
fix_failing_pr() {
  local pr_number="$1"
  local pr_title="$2"
  local branch="$3"

  log "━━━ PR #${pr_number}: ${pr_title}"
  info "Branch: $branch — fetching failing check details…"

  local failures
  failures=$(get_failing_checks_summary "$branch")
  info "Failing checks:\n$failures"

  # ── Check out the branch ──────────────────────────────────────────────────
  git -C "$REPO_PATH" fetch origin "$branch" --quiet
  git -C "$REPO_PATH" checkout "$branch" --quiet
  git -C "$REPO_PATH" reset --hard "origin/$branch" --quiet
  info "Checked out $branch"

  # ── Build the fix prompt ──────────────────────────────────────────────────
  local prompt
  prompt=$(cat <<PROMPT
You are fixing CI failures on a GitHub Pull Request in a TypeScript monorepo (Next.js · Convex · Better Auth).

## PR Details
- PR #${pr_number}: ${pr_title}
- Branch: ${branch}  ← already checked out, do NOT switch branches

## Failing CI Checks
${failures}

## Repository
- Path: ${REPO_PATH}

## Steps (execute in order)
1. Read \`${REPO_PATH}/AGENTS.md\` for project coding standards and conventions.
2. Inspect the failing checks above. Diagnose the root causes by reading the relevant source files.
3. Fix all errors reported by the failing checks.
4. Auto-fix linting: \`cd ${REPO_PATH} && bun x ultracite fix\`
5. Verify types: \`cd ${REPO_PATH} && bun run check-types\` — fix any remaining type errors.
6. Stage and commit: \`cd ${REPO_PATH} && git add -A && git commit -m "fix: resolve CI failures on PR #${pr_number}"\`
7. Push the branch: \`cd ${REPO_PATH} && git push origin ${branch}\`

## Constraints
- Do NOT open a new PR — just push fixes to the existing branch.
- Keep changes minimal and focused on what the CI is complaining about.
- Ensure all code is type-safe and follows patterns already in the codebase.
PROMPT
)

  info "Running Claude to fix CI errors…"
  if ! claude \
      --permission-mode bypassPermissions \
      --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
      -p "$prompt"; then
    err "Claude failed to fix PR #${pr_number}"
    git -C "$REPO_PATH" checkout "$BASE_BRANCH" --quiet
    return 1
  fi

  ok "Fixes pushed for PR #${pr_number}"
  git -C "$REPO_PATH" checkout "$BASE_BRANCH" --quiet
}

# Scans all open PRs and tries to fix any with failing CI
check_and_fix_open_prs() {
  log "No Backlog/Todo issues found — scanning open PRs for CI failures…"

  local prs_json pr_count
  prs_json=$(get_open_prs)
  pr_count=$(echo "$prs_json" | jq 'length')

  if [[ "$pr_count" -eq 0 ]]; then
    log "No open PRs — nothing to do."
    return 0
  fi

  log "Found $pr_count open PR(s). Checking CI status…"

  local fixed=0
  local pending=0
  local passing=0

  for i in $(seq 0 $((pr_count - 1))); do
    local pr_number pr_title branch
    pr_number=$(echo "$prs_json" | jq -r ".[$i].number")
    pr_title=$(echo   "$prs_json" | jq -r ".[$i].title")
    branch=$(echo     "$prs_json" | jq -r ".[$i].head.ref")

    local ci_status
    ci_status=$(get_pr_ci_status "$branch")
    info "PR #${pr_number} ($branch): CI is ${ci_status}"

    case "$ci_status" in
      failing)
        fix_failing_pr "$pr_number" "$pr_title" "$branch" || true
        (( fixed++ )) || true
        ;;
      pending)
        (( pending++ )) || true
        ;;
      passing|no_checks)
        (( passing++ )) || true
        ;;
    esac

    [[ $i -lt $((pr_count - 1)) ]] && sleep 2
  done

  log "PR scan complete — fixed: $fixed  pending: $pending  passing: $passing"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  check_prereqs

  log "═══════════════════════════════════════════"
  log " Linear Agent — $(date '+%Y-%m-%d %H:%M')"
  log "═══════════════════════════════════════════"
  log "Repo: $REPO_PATH"
  log "Fetching Backlog + Todo issues from Linear…"

  local issues_json count
  issues_json=$(get_actionable_issues)
  count=$(echo "$issues_json" | jq '.data.issues.nodes | length')

  log "Found $count Backlog/Todo issue(s)"

  if [[ "$count" -eq 0 ]]; then
    check_and_fix_open_prs
  else
    for i in $(seq 0 $((count - 1))); do
      local id identifier title description
      id=$(echo          "$issues_json" | jq -r ".data.issues.nodes[$i].id")
      identifier=$(echo  "$issues_json" | jq -r ".data.issues.nodes[$i].identifier")
      title=$(echo       "$issues_json" | jq -r ".data.issues.nodes[$i].title")
      description=$(echo "$issues_json" | jq -r ".data.issues.nodes[$i].description // \"\"")

      process_issue "$id" "$identifier" "$title" "$description" || true

      # Brief pause between issues so git operations don't race
      [[ $i -lt $((count - 1)) ]] && sleep 3
    done
  fi

  log "═══════════════════════════════════════════"
  log " All done"
  log "═══════════════════════════════════════════"
}

main "$@"
