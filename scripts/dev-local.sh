#!/usr/bin/env bash
# Arranca el entorno DEV local con Docker (Supabase).
# Requiere: Docker en marcha + Supabase CLI (brew install supabase/tap/supabase)
# Uso: desde repo smile-transformation-platform -> ./scripts/dev-local.sh

set -e
cd "$(dirname "$0")/.."
PROJECT_DIR="$PWD"

echo "=== DEV local (Docker) ==="

# 1. Docker
if ! docker info &>/dev/null; then
  echo "❌ Docker no está corriendo. Abre Docker Desktop y vuelve a ejecutar."
  exit 1
fi
echo "✓ Docker OK"

# 2. Supabase CLI
if ! command -v supabase &>/dev/null; then
  echo "❌ Supabase CLI no instalado."
  echo "   Instala: brew install supabase/tap/supabase"
  echo "   O desde el repo proyectos: bash scripts/instalar-herramientas-dev.sh"
  exit 1
fi
echo "✓ Supabase CLI OK"

# 3. Arrancar Supabase (usa Docker)
if supabase status &>/dev/null; then
  echo "✓ Supabase ya está corriendo."
else
  echo "Iniciando Supabase (Docker)..."
  supabase start
fi

# 4. Mostrar URLs y keys para .env.local
echo ""
echo "--- Copia esto a .env.local para apuntar a Supabase LOCAL ---"
echo ""
supabase status 2>/dev/null | grep -E "API URL|anon key|service_role key" || true
echo ""
echo "Ejemplo .env.local (local):"
echo "  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key de 'supabase status'>"
echo "  SUPABASE_URL=http://127.0.0.1:54321"
echo "  SUPABASE_SERVICE_ROLE_KEY=<service_role key de 'supabase status'>"
echo ""
echo "Studio (DB UI): http://127.0.0.1:54323"
echo ""
echo "Para levantar la app: npm run dev"
echo "Para parar Supabase: supabase stop"
echo ""
