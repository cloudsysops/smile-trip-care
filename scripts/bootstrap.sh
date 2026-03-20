#!/usr/bin/env bash
# Bootstrap local setup for Nebula Smile.
# Run from repo root: ./scripts/bootstrap.sh
# Non-destructive: checks and validates; does not overwrite .env.local.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Nebula Smile — Bootstrap ==="
echo ""

# 1. Install checks
echo "--- 1. Required tools ---"
MISSING=()
for cmd in git node npm; do
  if command -v "$cmd" &>/dev/null; then
    echo "  ✓ $cmd ($($cmd --version 2>/dev/null | head -1))"
  else
    echo "  ✗ $cmd (missing)"
    MISSING+=("$cmd")
  fi
done
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "  Install missing: ${MISSING[*]}"
  exit 1
fi

echo ""
echo "--- 2. Optional tools ---"
for cmd in docker gh terraform vercel stripe; do
  if command -v "$cmd" &>/dev/null; then
    echo "  ✓ $cmd"
  else
    echo "  ○ $cmd (optional, not installed)"
  fi
done
if ! command -v supabase &>/dev/null; then
  echo "  ○ supabase CLI (optional for local DB; install: brew install supabase/tap/supabase)"
fi

echo ""
echo "--- 3. Dependencies ---"
if [[ ! -d node_modules ]]; then
  echo "  Installing npm dependencies..."
  npm ci
else
  echo "  ✓ node_modules present (run 'npm ci' to refresh)"
fi

echo ""
echo "--- 4. Environment ---"
if [[ -f .env.local ]]; then
  echo "  ✓ .env.local exists"
  ./scripts/check_env.sh || true
else
  echo "  ○ .env.local not found"
  echo "    Copy .env.example to .env.local and fill required values:"
  echo "    cp .env.example .env.local"
  echo "    See docs/ENV_Y_STRIPE.md and docs/LOCAL_SETUP.md"
fi

echo ""
echo "--- 5. Next steps ---"
echo "  1. Ensure .env.local has required vars (see .env.example and docs)."
echo "  2. Start app: npm run dev  (or: make dev-up then npm run dev)"
echo "  3. Verify: make verify  or  npm run verify"
echo ""
echo "  Full guide: docs/LOCAL_SETUP.md"
echo "  Tooling audit: docs/TOOLING_AUDIT.md"
echo ""
