#!/usr/bin/env bash
# Start local development stack (Supabase via Docker if CLI present; otherwise instructions).
# Run from repo root: ./scripts/dev_up.sh  or  make dev-up

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== Dev stack up ==="

# Docker
if ! docker info &>/dev/null; then
  echo "Docker is not running. Start Docker Desktop and re-run."
  exit 1
fi
echo "✓ Docker OK"

# Optional: Supabase local
if command -v supabase &>/dev/null; then
  if supabase status &>/dev/null; then
    echo "✓ Supabase already running"
  else
    echo "Starting Supabase (Docker)..."
    supabase start
  fi
  echo ""
  echo "Supabase local URLs (add to .env.local to use local DB):"
  supabase status 2>/dev/null | grep -E "API URL|anon key|service_role" || true
  echo "  Studio: http://127.0.0.1:54323"
else
  echo "○ Supabase CLI not installed — using remote Supabase. Install for local DB: brew install supabase/tap/supabase"
fi

echo ""
echo "Next: npm run dev"
echo "  App: http://localhost:3000"
echo ""
