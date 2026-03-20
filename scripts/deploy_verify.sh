#!/usr/bin/env bash
# Verifica que un deploy (URL) responde: página principal y /api/health.
# Uso: ./scripts/deploy_verify.sh https://tu-app.vercel.app
set -e
BASE="${1:?Usage: $0 <BASE_URL>}"
echo "=== Deploy verify: $BASE ==="
if curl -sfS --max-time 15 "$BASE" -o /dev/null; then
  echo "  GET $BASE → 200"
else
  echo "  GET $BASE → FAIL"
  exit 1
fi
if curl -sfS --max-time 15 "$BASE/api/health" -o /dev/null; then
  echo "  GET $BASE/api/health → 200"
else
  echo "  GET $BASE/api/health → FAIL"
  exit 1
fi
echo "=== Deploy verify complete ==="
