#!/usr/bin/env bash
# Stop local development stack (Supabase only; app is stopped with Ctrl+C).
# Run from repo root: ./scripts/dev_down.sh  or  make dev-down

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Dev stack down ==="

if command -v supabase &>/dev/null; then
  if supabase status &>/dev/null; then
    supabase stop
    echo "✓ Supabase stopped"
  else
    echo "○ Supabase was not running"
  fi
else
  echo "○ Supabase CLI not installed — nothing to stop"
fi

echo "Done. (Next.js: stop with Ctrl+C in the terminal where npm run dev is running.)"
