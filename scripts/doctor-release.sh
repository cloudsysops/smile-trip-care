#!/usr/bin/env bash
# Release-readiness doctor: compact audit before/after deploy.
# Usage: ./scripts/doctor-release.sh [HOST_URL]
# Example: ./scripts/doctor-release.sh https://smile-transformation-platform-dev.vercel.app
# If HOST_URL is provided, runs smoke deploy against it. No destructive actions.
# From repo root.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"
HOST="${1:-}"

FAIL=0
echo "=== SmileTripCare — Release doctor ==="

# Git
echo ""
echo "--- Git ---"
BRANCH=$(git branch --show-current 2>/dev/null || echo "?")
echo "  Branch: $BRANCH"
STATUS=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
echo "  Uncommitted changes: $STATUS files"

# Critical routes in repo
echo ""
echo "--- Critical routes (repo) ---"
ROUTES=(
  "app/page.tsx"
  "app/assessment/page.tsx"
  "app/assessment/AssessmentWizard.tsx"
  "app/assessment/proposal/page.tsx"
  "app/api/leads/route.ts"
  "app/api/health/route.ts"
)
for r in "${ROUTES[@]}"; do
  if [[ -f "$r" ]]; then
    echo "  OK    $r"
  else
    echo "  MISS  $r"
    FAIL=1
  fi
done

# Verify (lint + test + build)
echo ""
echo "--- npm run verify ---"
if npm run verify >/dev/null 2>&1; then
  echo "  OK    lint, test, build"
else
  echo "  FAIL  verify failed (run: npm run verify)"
  FAIL=1
fi

# Schema alignment
echo ""
echo "--- Supabase schema alignment ---"
if bash "${ROOT_DIR}/scripts/check-supabase-schema.sh"; then
  :
else
  FAIL=1
fi

# Optional smoke against host
if [[ -n "$HOST" ]]; then
  echo ""
  echo "--- Smoke deploy: $HOST ---"
  if bash "${ROOT_DIR}/scripts/smoke-deploy.sh" "$HOST"; then
    :
  else
    FAIL=1
  fi
else
  echo ""
  echo "--- Smoke deploy ---"
  echo "  Skip: no host provided. Run with URL to smoke: ./scripts/doctor-release.sh <HOST>"
fi

echo ""
echo "=== Doctor summary ==="
if [[ $FAIL -eq 0 ]]; then
  echo "  All checks passed."
  exit 0
else
  echo "  One or more checks failed. Fix before release."
  exit 1
fi
