#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"

if [ -z "$BASE_URL" ]; then
  echo "Usage:"
  echo "  ./scripts/production-readiness-audit.sh https://your-domain.com"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required for production-readiness-audit.sh but was not found in PATH."
  echo "Please install curl on this machine or run the audit from an environment that has curl available."
  exit 1
fi

echo ""
echo "Production Readiness Audit"
echo "Target: $BASE_URL"
echo "-----------------------------------"

FAILURES=0

check_endpoint () {
  local PATH="$1"
  local URL="${BASE_URL}${PATH}"

  printf "Checking %-30s" "$PATH"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || true)

  if [[ "$STATUS" == "200" || "$STATUS" == "204" || "$STATUS" == "302" ]]; then
    echo "OK ($STATUS)"
  else
    echo "FAIL ($STATUS)"
    FAILURES=$((FAILURES+1))
  fi
}

echo ""
echo "Page checks"
echo "-----------------------------------"

check_endpoint "/"
check_endpoint "/assessment"
check_endpoint "/thank-you"

echo ""
echo "API health checks"
echo "-----------------------------------"

check_endpoint "/api/health"
check_endpoint "/api/health/ready"

echo ""
echo "Optional status endpoint"
echo "-----------------------------------"

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/status" || true)

if [[ "$STATUS_CODE" == "200" ]]; then
  echo "/api/status                     OK ($STATUS_CODE)"
else
  echo "/api/status                     SKIPPED (not present)"
fi

echo ""
echo "-----------------------------------"

if [ "$FAILURES" -eq 0 ]; then
  echo "RESULT: READY"
  exit 0
else
  echo "RESULT: BLOCKED ($FAILURES checks failed)"
  exit 1
fi

