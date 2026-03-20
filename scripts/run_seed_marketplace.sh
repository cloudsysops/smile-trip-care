#!/usr/bin/env bash
# Run marketplace foundation seed (Clínica San Martín + specialists, experiences, packages, junctions).
# Requires: migrations 0001–0010 applied, and DATABASE_URL or Supabase linked.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SEED_FILE="$REPO_ROOT/scripts/seed_marketplace_foundation.sql"

cd "$REPO_ROOT"
[ -f "$SEED_FILE" ] || { echo "Missing $SEED_FILE"; exit 1; }

if [ -f "$REPO_ROOT/.env.local" ]; then
  set -a
  # shellcheck source=../.env.local
  . "$REPO_ROOT/.env.local" 2>/dev/null || true
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL no está definida. Cárgala desde .env.local o exporta antes de ejecutar."
elif ! echo "$DATABASE_URL" | grep -q '^postgres'; then
  echo "DATABASE_URL debe ser una URL de Postgres (postgresql://...). Valor actual no reconocido."
elif ! command -v psql >/dev/null 2>&1; then
  echo "psql no está instalado. Usa el SQL Editor de Supabase con scripts/seed_marketplace_foundation.sql"
else
  echo "=== Running seed_marketplace_foundation.sql ==="
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SEED_FILE"
  echo "=== Seed complete ==="
  exit 0
fi

echo ""
echo "No se pudo ejecutar el seed (falta DATABASE_URL válida o psql)."
echo ""
echo "Option 1 — Set DATABASE_URL and run:"
echo "  export DATABASE_URL='postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres'"
echo "  ./scripts/run_seed_marketplace.sh"
echo ""
echo "Option 2 — Supabase Dashboard → SQL Editor → paste and run:"
echo "  scripts/seed_marketplace_foundation.sql"
echo ""
exit 1
