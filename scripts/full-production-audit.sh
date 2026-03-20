#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"

if [ -z "$BASE_URL" ]; then
  echo "Usage:"
  echo "  ./scripts/full-production-audit.sh https://your-domain.com"
  exit 1
fi

FAILURES=0
WARNINGS=0

echo ""
echo "Full Production Audit"
echo "Target: $BASE_URL"
echo "-----------------------------------"

check_endpoint () {
  local PATH="$1"
  local EXPECT="${2:-200}"
  local URL="${BASE_URL}${PATH}"

  printf "Checking %-32s" "$PATH"

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || true)

  if [[ "$EXPECT" == "non404" ]]; then
    if [[ "$STATUS" != "404" && "$STATUS" != "000" ]]; then
      echo "OK ($STATUS)"
    else
      echo "FAIL ($STATUS)"
      FAILURES=$((FAILURES+1))
    fi
    return
  fi

  if [[ "$STATUS" == "$EXPECT" ]]; then
    echo "OK ($STATUS)"
  else
    echo "FAIL ($STATUS, expected $EXPECT)"
    FAILURES=$((FAILURES+1))
  fi
}

check_env_present () {
  local NAME="$1"
  local VALUE="${!NAME:-}"

  printf "Env %-36s" "$NAME"

  if [[ -n "$VALUE" ]]; then
    echo "OK"
  else
    echo "WARN (missing)"
    WARNINGS=$((WARNINGS+1))
  fi
}

echo ""
echo "1) Public pages"
echo "-----------------------------------"
check_endpoint "/" "200"
check_endpoint "/assessment" "200"
check_endpoint "/thank-you" "200"

echo ""
echo "2) Health endpoints"
echo "-----------------------------------"
check_endpoint "/api/health" "200"
check_endpoint "/api/health/ready" "200"
check_endpoint "/api/leads" "non404"

echo ""
echo "3) Optional status endpoint"
echo "-----------------------------------"
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/status" || true)
if [[ "$STATUS_CODE" == "200" ]]; then
  echo "/api/status                        OK ($STATUS_CODE)"
else
  echo "/api/status                        SKIPPED (not present)"
fi

echo ""
echo "4) Environment sanity (local shell only)"
echo "-----------------------------------"
echo "These checks only validate whether env vars are present in your current shell."
echo "They do NOT confirm remote Vercel values unless you exported/pulled them locally."
check_env_present "SUPABASE_URL"
check_env_present "SUPABASE_SERVICE_ROLE_KEY"
check_env_present "NEXT_PUBLIC_SUPABASE_URL"
check_env_present "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_present "STRIPE_SECRET_KEY"
check_env_present "STRIPE_WEBHOOK_SECRET"

echo ""
echo "5) Stripe hints"
echo "-----------------------------------"
if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "Stripe secret key appears present locally."
else
  echo "WARN Stripe secret key not present locally."
  WARNINGS=$((WARNINGS+1))
fi

if [[ -n "${STRIPE_WEBHOOK_SECRET:-}" ]]; then
  echo "Stripe webhook secret appears present locally."
else
  echo "WARN Stripe webhook secret not present locally."
  WARNINGS=$((WARNINGS+1))
fi

echo ""
echo "6) Supabase hints"
echo "-----------------------------------"
if [[ -n "${SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "Supabase server env appears present locally."
else
  echo "WARN Supabase server env incomplete locally."
  WARNINGS=$((WARNINGS+1))
fi

echo ""
echo "-----------------------------------"
if [[ "$FAILURES" -eq 0 ]]; then
  if [[ "$WARNINGS" -eq 0 ]]; then
    echo "RESULT: READY"
    exit 0
  else
    echo "RESULT: READY with WARNINGS ($WARNINGS)"
    exit 0
  fi
else
  echo "RESULT: BLOCKED ($FAILURES failures, $WARNINGS warnings)"
  exit 1
fi

