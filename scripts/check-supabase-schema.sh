#!/usr/bin/env bash
# Supabase schema alignment checker (read-only).
# Compares repo migrations vs remote Supabase migration state.
# Fails clearly if remote is behind local. Recommends: supabase db push
#
# Usage: ./scripts/check-supabase-schema.sh
# Exit: 0 = aligned or skipped (no link), 1 = remote behind or error
# From repo root.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Supabase schema alignment check ==="

if ! command -v supabase &>/dev/null; then
  echo "  Skip: Supabase CLI not found. Install it to compare migrations."
  echo "  See: https://supabase.com/docs/guides/cli"
  exit 0
fi

# Check link (optional; migration list may still work with --linked or default)
if ! supabase projects list &>/dev/null; then
  echo "  Skip: Not logged in or no Supabase projects. Run: supabase login"
  exit 0
fi

LINKED_COUNT=$(supabase projects list 2>/dev/null | grep -c "●" || true)
if [[ "${LINKED_COUNT:-0}" -eq 0 ]]; then
  echo "  Skip: No linked Supabase project. Link with: supabase link --project-ref <ref>"
  exit 0
fi

echo "  Comparing local migrations to remote..."
OUTPUT=""
if ! OUTPUT=$(supabase migration list 2>&1); then
  echo "  Error running: supabase migration list"
  echo "$OUTPUT" | head -20
  exit 1
fi

# Parse: find lines where Local has a migration id but Remote is empty
# Format: "  0001  | 0001   | 0001" or "  0011  |        | 0011"
BEHIND=0
while IFS= read -r line; do
  # Skip header / separator
  [[ "$line" =~ Local ]] && continue
  [[ "$line" =~ ------- ]] && continue
  # Split by |; col1=local, col2=remote. If col1 has digits and col2 is blank, remote is behind.
  local_col="${line%%|*}"; local_col="${local_col// /}"
  rest="${line#*|}"; remote_col="${rest%%|*}"; remote_col="${remote_col// /}"
  if [[ -n "$local_col" && "$local_col" =~ ^[0-9]+$ && -z "$remote_col" ]]; then
    BEHIND=1
    break
  fi
done <<< "$OUTPUT"

if [[ "$BEHIND" -eq 1 ]]; then
  echo ""
  echo "  FAIL: Remote Supabase database is behind local migrations."
  echo "  The deployed app expects columns/tables from migrations that are not applied on remote."
  echo "  This can cause POST /api/leads and other endpoints to return 500."
  echo ""
  echo "  Recommended fix:"
  echo "    supabase db push"
  echo ""
  echo "  Or apply missing migrations manually in Supabase Dashboard → SQL Editor"
  echo "  (see supabase/migrations/ and MIGRATION_ORDER.md)."
  echo ""
  exit 1
fi

echo "  OK: Remote migration state is in sync with local (or ahead)."
exit 0
