#!/usr/bin/env bash
# Deploy smoke test: verify critical routes return expected status codes.
# Usage: ./scripts/smoke-deploy.sh [BASE_URL]
# Example: ./scripts/smoke-deploy.sh https://smile-transformation-platform-dev.vercel.app
# From repo root.

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
FAIL=0

echo "=== Smoke deploy: $BASE_URL ==="

check() {
  local name="$1"
  local url="$2"
  local expect_ok="${3:-200}"   # default expect 200; use "non404" for /api/leads (405 is ok)
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$url" 2>/dev/null || echo "000")
  if [[ "$expect_ok" == "non404" ]]; then
    if [[ "$code" == "404" ]]; then
      echo "  FAIL  $name (HTTP $code — expected non-404)"
      return 1
    else
      echo "  OK    $name (HTTP $code)"
      return 0
    fi
  fi
  if [[ "$code" == "$expect_ok" ]]; then
    echo "  OK    $name (HTTP $code)"
    return 0
  else
    echo "  FAIL  $name (HTTP $code — expected $expect_ok)"
    return 1
  fi
}

check "/"                          "$BASE_URL/"                          "200" || FAIL=1
check "/assessment"                 "$BASE_URL/assessment"                 "200" || FAIL=1
check "/assessment/proposal"        "$BASE_URL/assessment/proposal"        "200" || FAIL=1
check "/login"                      "$BASE_URL/login"                      "200" || FAIL=1
check "/signup"                     "$BASE_URL/signup"                     "200" || FAIL=1
check "/api/health"                 "$BASE_URL/api/health"                "200" || FAIL=1
check "/api/leads (non-404)"        "$BASE_URL/api/leads"                  "non404" || FAIL=1

echo "---"
if [[ $FAIL -eq 0 ]]; then
  echo "Smoke deploy: all checks passed."
  exit 0
else
  echo "Smoke deploy: one or more checks failed."
  exit 1
fi
