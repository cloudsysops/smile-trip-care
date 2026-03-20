#!/usr/bin/env bash
# Smoke test: verify /api/health and /api/health/ready return 200.
# Usage: ./scripts/smoke_test.sh [BASE_URL]
# Example: ./scripts/smoke_test.sh https://myapp.vercel.app

set -e
BASE_URL="${1:-http://localhost:3000}"
FAIL=0

echo "Smoke test: $BASE_URL"
echo "---"

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "200" ]; then
    echo "  OK   $name ($code)"
  else
    echo "  FAIL $name (HTTP $code)"
    FAIL=1
  fi
}

check "/api/health"      "$BASE_URL/api/health"
check "/api/health/ready" "$BASE_URL/api/health/ready"

echo "---"
if [ $FAIL -eq 0 ]; then
  echo "Smoke test passed."
  exit 0
else
  echo "Smoke test failed."
  exit 1
fi
