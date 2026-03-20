#!/usr/bin/env bash
# Run database migrations first.
# Option A: If project is linked, runs: npx supabase db push
# Option B: If DATABASE_URL (Postgres connection string) is set, runs each migration with psql
# Option C: Otherwise prints instructions to run SQL in Supabase Dashboard.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/supabase/migrations"

cd "$REPO_ROOT"

# Load env so DATABASE_URL can be used (e.g. from .env.local)
if [ -f "$REPO_ROOT/.env.local" ]; then
  set -a
  # shellcheck source=../.env.local
  . "$REPO_ROOT/.env.local" 2>/dev/null || true
  set +a
fi

echo "=== Database migrations ==="

# A) Supabase CLI linked project (--yes to avoid interactive prompt)
SUPABASE_OUTPUT="$(npx supabase db push --yes 2>&1)" && SUPABASE_EXIT=0 || SUPABASE_EXIT=$?
if [ "$SUPABASE_EXIT" -eq 0 ]; then
  echo "Migrations pushed successfully (Supabase project linked)."
  exit 0
fi
if echo "$SUPABASE_OUTPUT" | grep -q "Access token not provided\|Have you run supabase link"; then
  echo ""
  echo "Supabase CLI needs login and link. Run (from repo root):"
  echo "  npx supabase login"
  echo "  npx supabase link --project-ref YOUR_PROJECT_REF"
  echo "  npm run db:migrate"
  echo ""
  echo "Project ref: Supabase Dashboard → Project Settings → General → Reference ID"
  echo ""
fi

# B) Direct Postgres (e.g. DATABASE_URL from Supabase Dashboard → Settings → Database)
if [ -n "$DATABASE_URL" ] && command -v psql >/dev/null 2>&1; then
  echo "Using DATABASE_URL and psql to apply migrations..."
  for f in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
    [ -f "$f" ] || continue
    echo "  Applying $(basename "$f")..."
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || exit 1
  done
  echo "Migrations applied successfully."
  echo "Next: run scripts/seed_medical_tourism.sql in SQL Editor or: psql \"\$DATABASE_URL\" -f scripts/seed_medical_tourism.sql"
  exit 0
fi

# C) Manual instructions
echo ""
echo "Could not apply migrations automatically."
echo ""
echo "Apply manually in Supabase Dashboard → SQL Editor (run in order):"
n=1
for f in $(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  [ -f "$f" ] && echo "  $n. $f" && n=$((n+1))
done
echo ""
echo "Then run: scripts/seed_medical_tourism.sql"
echo ""
echo "Alternatively:"
echo "  • Login and link:  npx supabase login  →  npx supabase link --project-ref YOUR_REF  →  npm run db:migrate"
echo "  • Or set DATABASE_URL (Postgres connection string) and have psql installed, then  npm run db:migrate"
exit 1
