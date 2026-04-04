#!/usr/bin/env bash
# =============================================================================
# linear-agent.sh
#
# Implements a single Linear issue (Cowork-orchestrated mode) OR polls Linear
# directly (standalone mode) and then:
#   1. Creates a feature branch
#   2. Runs Claude to implement the changes
#   3. Opens a GitHub PR via the gh CLI
#   4. Enables auto-merge (merges when CI passes)
#   5. Updates the Linear issue status + adds a comment (if LINEAR_API_KEY set)
#
# If there are no Backlog/Todo issues, it scans open PRs for failing CI checks
# and runs Claude to fix any errors it finds.
#
# ── Operating modes ──────────────────────────────────────────────────────────
#
#   COWORK MODE (preferred — used by Cowork scheduled task):
#     Called by Claude after it queries Linear via MCP. Issue data is passed via
#     environment variables. Linear status updates are handled by Claude/MCP.
#
#     Required env vars:
#       ISSUE_IDENTIFIER   e.g. "UNL-35"
#       ISSUE_LINEAR_ID    e.g. "abc123-..."   (Linear internal UUID)
#       ISSUE_TITLE        e.g. "Google Calendar sync"
#       ISSUE_DESCRIPTION  (full description text)
#
#   STANDALONE MODE (used when running outside Cowork):
#     Queries Linear API directly. All Linear status updates are handled here.
#
#     Required env var (or in scripts/.env):
#       LINEAR_API_KEY     lin_api_...
#
# ── GitHub authentication ─────────────────────────────────────────────────────
#
#   The script uses the gh CLI for all GitHub operations (auto-installs if
#   missing via Homebrew). To authenticate gh CLI, either:
#     a) Run `gh auth login` once (browser-based, persists in keychain)
#     b) Set GH_TOKEN in environment or scripts/.env (non-interactive)
#
# ── Other prerequisites ───────────────────────────────────────────────────────
#   - claude   — Claude CLI in PATH (https://claude.ai/code)
#   - jq       — JSON processor (`brew install jq`)
#   - git      — with SSH or HTTPS credentials for the repo
#
# Usage:
#   bash scripts/linear-agent.sh                     # standalone mode
#   ISSUE_IDENTIFIER=UNL-35 ... bash scripts/...     # Cowork/single-issue mode
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"
GITHUB_REPO="mrisoli/yellow"
BASE_BRANCH="main"

# Linear workspace constants (used in standalone mode)
LINEAR_TEAM_ID="c4962e7a-41a8-4ec7-b5ea-53fa2a4a1e92"
LINEAR_BACKLOG_STATUS_ID="f16554f0-df64-4890-8cf1-4818781d2eb0"
LINEAR_TODO_STATUS_ID="782868c7-efb7-4455-91a7-29ae591dc15d"
LINEAR_IN_PROGRESS_STATUS_ID="b9bd611c-b7a2-4561-81ca-4e9f53be5b94"
LINEAR_IN_REVIEW_STATUS_ID="2bb1c368-181c-49be-9ff4-68d330a0f179"
LINEAR_API_URL="https://api.linear.app/graphql"

# ---------------------------------------------------------------------------
# Load .env file if present
# ---------------------------------------------------------------------------
ENV_FILE="$SCRIPT_DIR/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# ---------------------------------------------------------------------------
# Detect operating mode
# ---------------------------------------------------------------------------
COWORK_MODE=false
if [[ -n "${ISSUE_IDENTIFIER:-}" ]]; then
  COWORK_MODE=true
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { echo "$(date '+%H:%M:%S') $*"; }
info() { log "  ℹ $*"; }
ok()   { log "  ✓ $*"; }
err()  { log "  ✗ $*" >&2; }

# ---------------------------------------------------------------------------
# GitHub CLI setup — installs gh if missing, authenticates if needed
# ---------------------------------------------------------------------------
setup_gh_cli() {
  # Install gh CLI if not present
  if ! command -v gh &>/dev/null; then
    info "gh CLI not found — installing via Homebrew..."
    if ! command -v brew &>/dev/null; then
      err "Homebrew is not installed. Install gh CLI manually: https://cli.github.com"
      err "Then run: gh auth login"
      exit 1
    fi
    brew install gh
    ok "gh CLI installed"
  fi

  # Authenticate gh CLI if needed
  if ! gh auth status &>/dev/null 2>&1; then
    if [[ -n "${GH_TOKEN:-}" ]]; then
      info "Authenticating gh CLI with GH_TOKEN..."
      echo "$GH_TOKEN" | gh auth login --with-token
      ok "gh CLI authenticated"
    else
      err "gh CLI is not authenticated."
      err "Run one of the following to set up access:"
      err "  • gh auth login                    (interactive browser login)"
      err "  • echo \$GH_TOKEN | gh auth login --with-token"
      err "  • Add GH_TOKEN=ghp_... to scripts/.env"
      exit 1
    fi
  fi

  info "GitHub: $(gh auth status 2>&1 | grep 'Logged in' | head -1 | sed 's/.*Logged in to //' | sed 's/ as / as /')"
}

# ---------------------------------------------------------------------------
# GitHub operations (gh CLI)
# ---------------------------------------------------------------------------

# Create a PR and print its URL
github_create_pr() {
  local branch="$1" title="$2" body="$3"
  gh pr create \
    --repo "$GITHUB_REPO" \
    --title "$title" \
    --body "$body" \
    --head "$branch" \
    --base "$BASE_BRANCH" \
    2>/dev/null
}

# Enable auto-merge on a PR by number
github_enable_automerge() {
  local pr_number="$1"
  gh pr merge "$pr_number" \
    --repo "$GITHUB_REPO" \
    --auto \
    --squash \
    2>/dev/null || true
  # Non-fatal: auto-merge may not be enabled on the repo
}

# Print a JSON array of open PRs: [{number, title, headRefName}]
get_open_prs() {
  gh pr list \
    --repo "$GITHUB_REPO" \
    --state open \
    --limit 50 \
    --json number,title,headRefName \
    2>/dev/null || echo "[]"
}

# Print "failing", "pending", "passing", or "no_checks" for a branch's latest CI
get_pr_ci_status() {
  local branch="$1"

  local checks
  checks=$(gh pr checks \
    --repo "$GITHUB_REPO" \
    "$branch" \
    --json name,conclusion,status \
    2>/dev/null || echo "[]")

  local total failed in_progress
  total=$(echo "$checks"      | jq 'length')
  failed=$(echo "$checks"     | jq '[.[] | select(.conclusion == "FAILURE" or .conclusion == "TIMED_OUT")] | length')
  in_progress=$(echo "$checks"| jq '[.[] | select(.status == "IN_PROGRESS" or .status == "QUEUED" or .status == "WAITING")] | length')

  if   [[ "$total"       -eq 0 ]]; then echo "no_checks"
  elif [[ "$failed"      -gt 0 ]]; then echo "failing"
  elif [[ "$in_progress" -gt 0 ]]; then echo "pending"
  else echo "passing"
  fi
}

# Print a human-readable summary of failing checks for a branch
get_failing_checks_summary() {
  local branch="$1"
  gh pr checks \
    --repo "$GITHUB_REPO" \
    "$branch" \
    --json name,conclusion,detailsUrl \
    2>/dev/null \
  | jq -r '
    .[]
    | select(.conclusion == "FAILURE" or .conclusion == "TIMED_OUT")
    | "  Check: \(.name)\n  Conclusion: \(.conclusion)\n  Details: \(.detailsUrl // "(no url)")\n"
  ' || echo "(could not fetch check details)"
}

# ---------------------------------------------------------------------------
# Linear API helpers (standalone mode only — Cowork mode skips these)
# ---------------------------------------------------------------------------

linear_api_available() {
  [[ -n "${LINEAR_API_KEY:-}" ]]
}

linear_gql() {
  curl -sf -X POST "$LINEAR_API_URL" \
    -H "Authorization: $LINEAR_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$1"
}

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

set_issue_status() {
  local issue_id="$1" status_id="$2"
  if linear_api_available; then
    linear_gql "$(jq -n \
      --arg id      "$issue_id" \
      --arg stateId "$status_id" \
      '{
        query: "mutation SetStatus($id: String!, $stateId: String!) { issueUpdate(id: $id, input: { stateId: $stateId }) { success } }",
        variables: { id: $id, stateId: $stateId }
      }')" >/dev/null
  else
    info "LINEAR_API_KEY not set — skipping Linear status update (handled by Cowork MCP)"
  fi
}

add_linear_comment() {
  local issue_id="$1" body="$2"
  if linear_api_available; then
    linear_gql "$(jq -n \
      --arg issueId "$issue_id" \
      --arg body    "$body" \
      '{
        query: "mutation AddComment($issueId: String!, $body: String!) { commentCreate(input: { issueId: $issueId, body: $body }) { success } }",
        variables: { issueId: $issueId, body: $body }
      }')" >/dev/null
  else
    info "LINEAR_API_KEY not set — skipping Linear comment (handled by Cowork MCP)"
  fi
}

# ---------------------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------------------
check_prereqs() {
  local missing=()
  command -v claude &>/dev/null || missing+=("claude CLI  — https://claude.ai/code")
  command -v jq     &>/dev/null || missing+=("jq  — brew install jq")
  command -v git    &>/dev/null || missing+=("git")

  # In standalone mode, LINEAR_API_KEY is required
  if [[ "$COWORK_MODE" == "false" ]] && [[ -z "${LINEAR_API_KEY:-}" ]]; then
    missing+=("LINEAR_API_KEY  — set in env or scripts/.env (not needed in Cowork mode)")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    err "Missing prerequisites:"
    for item in "${missing[@]}"; do
      err "  • $item"
    done
    exit 1
  fi

  setup_gh_cli
}

# ---------------------------------------------------------------------------
# Build a safe git branch name
# ---------------------------------------------------------------------------
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
# Core: implement one issue
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

  # Guard: skip if the branch is already on the remote
  if git -C "$REPO_PATH" ls-remote --heads origin "$branch" 2>/dev/null | grep -q .; then
    info "Branch already exists remotely — skipping (already in progress)"
    return 0
  fi

  # Mark In Progress (no-op in Cowork mode — Claude updates Linear via MCP)
  set_issue_status "$issue_id" "$LINEAR_IN_PROGRESS_STATUS_ID"
  info "Linear status → In Progress"

  # Prepare a clean branch from main
  git -C "$REPO_PATH" fetch origin "$BASE_BRANCH" --quiet
  git -C "$REPO_PATH" checkout "$BASE_BRANCH" --quiet
  git -C "$REPO_PATH" reset --hard "origin/$BASE_BRANCH" --quiet
  git -C "$REPO_PATH" checkout -b "$branch"
  info "Branch created from origin/$BASE_BRANCH"

  # Build the implementation prompt
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

  # Run Claude to implement
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

  # Verify the branch was pushed
  if ! git -C "$REPO_PATH" ls-remote --heads origin "$branch" 2>/dev/null | grep -q .; then
    err "Branch was not pushed for $identifier — Claude may not have completed the commit/push step"
    git -C "$REPO_PATH" checkout "$BASE_BRANCH" --quiet
    set_issue_status "$issue_id" "$LINEAR_TODO_STATUS_ID"
    return 1
  fi
  ok "Branch pushed"

  # Open the PR via gh CLI
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
  ok "PR opened: $pr_url"

  # Enable auto-merge
  pr_number=$(echo "$pr_url" | grep -oE '[0-9]+$' || true)
  if [[ -n "$pr_number" ]]; then
    github_enable_automerge "$pr_number"
    ok "Auto-merge requested"
  fi

  # Update Linear (no-op in Cowork mode)
  set_issue_status "$issue_id" "$LINEAR_IN_REVIEW_STATUS_ID"
  add_linear_comment "$issue_id" \
    "🤖 PR opened automatically: ${pr_url} — auto-merge is enabled and will trigger once CI passes."
  ok "Linear updated → In Review"

  # In Cowork mode, print the PR URL so Claude (the parent session) can capture it
  # and update Linear via MCP
  if [[ "$COWORK_MODE" == "true" ]]; then
    echo "COWORK_PR_URL=${pr_url}"
    echo "COWORK_PR_NUMBER=${pr_number}"
  fi
}

# ---------------------------------------------------------------------------
# Fallback: fix failing CI on open PRs
# ---------------------------------------------------------------------------
fix_failing_pr() {
  local pr_number="$1"
  local pr_title="$2"
  local branch="$3"

  log "━━━ PR #${pr_number}: ${pr_title}"
  info "Branch: $branch — fetching failing check details…"

  local failures
  failures=$(get_failing_checks_summary "$branch")
  info "Failing checks:\n$failures"

  git -C "$REPO_PATH" fetch origin "$branch" --quiet
  git -C "$REPO_PATH" checkout "$branch" --quiet
  git -C "$REPO_PATH" reset --hard "origin/$branch" --quiet
  info "Checked out $branch"

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

  local fixed=0 pending=0 passing=0

  for i in $(seq 0 $((pr_count - 1))); do
    local pr_number pr_title branch
    pr_number=$(echo "$prs_json" | jq -r ".[$i].number")
    pr_title=$(echo   "$prs_json" | jq -r ".[$i].title")
    branch=$(echo     "$prs_json" | jq -r ".[$i].headRefName")

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
  log " Mode: $( [[ "$COWORK_MODE" == "true" ]] && echo "Cowork (single issue)" || echo "Standalone (full poll)" )"
  log "═══════════════════════════════════════════"
  log "Repo: $REPO_PATH"

  # ── Cowork mode: implement the single issue passed in via env vars ────────
  if [[ "$COWORK_MODE" == "true" ]]; then
    local id="${ISSUE_LINEAR_ID:-}"
    local identifier="${ISSUE_IDENTIFIER}"
    local title="${ISSUE_TITLE:-}"
    local description="${ISSUE_DESCRIPTION:-}"

    if [[ -z "$title" ]]; then
      err "ISSUE_TITLE is required in Cowork mode"
      exit 1
    fi

    process_issue "$id" "$identifier" "$title" "$description"

    log "═══════════════════════════════════════════"
    log " Done"
    log "═══════════════════════════════════════════"
    return
  fi

  # ── Standalone mode: query Linear API, pick one issue, implement it ───────
  log "Fetching Backlog + Todo issues from Linear…"

  local issues_json count
  issues_json=$(get_actionable_issues)
  count=$(echo "$issues_json" | jq '.data.issues.nodes | length')

  log "Found $count Backlog/Todo issue(s)"

  if [[ "$count" -eq 0 ]]; then
    check_and_fix_open_prs
  else
    # Process only the first issue per run (avoid git conflicts; re-run for more)
    local id identifier title description
    id=$(echo          "$issues_json" | jq -r ".data.issues.nodes[0].id")
    identifier=$(echo  "$issues_json" | jq -r ".data.issues.nodes[0].identifier")
    title=$(echo       "$issues_json" | jq -r ".data.issues.nodes[0].title")
    description=$(echo "$issues_json" | jq -r ".data.issues.nodes[0].description // \"\"")

    process_issue "$id" "$identifier" "$title" "$description"
  fi

  log "═══════════════════════════════════════════"
  log " All done"
  log "═══════════════════════════════════════════"
}

main "$@"
