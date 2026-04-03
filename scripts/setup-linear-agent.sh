#!/usr/bin/env bash
# =============================================================================
# setup-linear-agent.sh
#
# One-time setup helper for the Linear agent workflow.
# Run this to verify your environment is ready.
# =============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✓${NC} $*"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $*"; }
fail() { echo -e "${RED}  ✗${NC} $*"; }

echo ""
echo "Linear Agent — Setup Check"
echo "══════════════════════════"
echo ""

PASS=true

# ── 1. jq ────────────────────────────────────────────────────────────────────
if command -v jq &>/dev/null; then
  ok "jq $(jq --version)"
else
  fail "jq not found.  Install: brew install jq"
  PASS=false
fi

# ── 2. gh CLI ────────────────────────────────────────────────────────────────
if command -v gh &>/dev/null; then
  ok "gh $(gh --version | head -1)"
  if gh auth status &>/dev/null; then
    ok "gh authenticated as: $(gh api user --jq '.login' 2>/dev/null || echo '(unknown)')"
  else
    fail "gh is not authenticated.  Run: gh auth login"
    PASS=false
  fi
else
  fail "gh not found.  Install: brew install gh  →  then run: gh auth login"
  PASS=false
fi

# ── 3. claude CLI ────────────────────────────────────────────────────────────
if command -v claude &>/dev/null; then
  ok "claude found at $(command -v claude)"
else
  fail "claude CLI not found.  Install: https://claude.ai/code"
  PASS=false
fi

# ── 4. LINEAR_API_KEY ────────────────────────────────────────────────────────
if [[ -n "${LINEAR_API_KEY:-}" ]]; then
  ok "LINEAR_API_KEY is set"
  # Test the key with a minimal API call
  if curl -sf -X POST https://api.linear.app/graphql \
      -H "Authorization: $LINEAR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"query":"{ viewer { id name } }"}' | jq -e '.data.viewer' &>/dev/null; then
    VIEWER=$(curl -sf -X POST https://api.linear.app/graphql \
      -H "Authorization: $LINEAR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"query":"{ viewer { name } }"}' | jq -r '.data.viewer.name')
    ok "Linear API key valid — authenticated as: $VIEWER"
  else
    fail "LINEAR_API_KEY appears invalid.  Get one from: Linear Settings › API › Personal API keys"
    PASS=false
  fi
else
  fail "LINEAR_API_KEY is not set."
  echo ""
  echo "       To fix, add this to your ~/.zshrc (or ~/.bashrc):"
  echo "         export LINEAR_API_KEY=\"lin_api_YOUR_KEY_HERE\""
  echo ""
  echo "       Get your key at: Linear › Settings › API › Personal API keys"
  PASS=false
fi

# ── 5. git + remote ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"

if git -C "$REPO_PATH" remote get-url origin &>/dev/null; then
  ok "Git remote: $(git -C "$REPO_PATH" remote get-url origin)"
else
  warn "No git remote 'origin' found — push/PR steps will fail"
fi

# ── 6. GitHub auto-merge setting ─────────────────────────────────────────────
echo ""
echo "  Note: For auto-merge to work, your GitHub repo must have"
echo "  'Allow auto-merge' enabled under Settings › General › Pull Requests."
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
if $PASS; then
  echo -e "${GREEN}All checks passed! You're ready to run:${NC}"
  echo ""
  echo "  bash scripts/linear-agent.sh"
  echo ""
else
  echo -e "${RED}Some checks failed. Fix the issues above, then re-run this script.${NC}"
  echo ""
  exit 1
fi
