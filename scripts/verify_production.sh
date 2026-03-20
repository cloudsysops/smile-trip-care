#!/usr/bin/env bash
# Verificación final de producción: health, ready, landing.
# Uso: ./scripts/verify_production.sh https://tu-dominio.vercel.app

set -e
URL="${1:?Usage: $0 <BASE_URL>}"
JQ=""
if command -v jq >/dev/null 2>&1; then JQ="jq"; fi

echo "Verifying: $URL"
echo "---"

echo "GET /api/health"
if [ -n "$JQ" ]; then
  curl -sS "$URL/api/health" | jq .
else
  curl -sS "$URL/api/health"
fi
echo ""

echo "GET /api/health/ready"
if [ -n "$JQ" ]; then
  curl -sS "$URL/api/health/ready" | jq .
else
  curl -sS "$URL/api/health/ready"
fi
echo ""

echo "GET /api/status"
if [ -n "$JQ" ]; then
  curl -sS "$URL/api/status" | jq .
else
  curl -sS "$URL/api/status"
fi
echo ""

echo "GET / (landing)"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "$URL/"

echo "---"
echo "Smoke test done."
