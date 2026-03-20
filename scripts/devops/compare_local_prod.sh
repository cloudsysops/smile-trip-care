#!/usr/bin/env bash
set -euo pipefail

LOCAL_BASE="${LOCAL_BASE:-http://localhost:3000}"
# Canonical dev/preview host (override if your Vercel URL differs).
PROD_BASE="${PROD_BASE:-https://smile-transformation-platform-dev.vercel.app}"

ROUTES=(
  "/"
  "/packages"
  "/assessment"
  "/assessment/proposal"
  "/thank-you"
  "/login"
  "/signup"
  "/patient"
  "/admin/leads"
  "/dental-implants-colombia"
  "/veneers-colombia"
  "/hollywood-smile-colombia"
  "/api/health"
  "/api/health/ready"
)

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

normalize_body() {
  local infile="$1"
  local outfile="$2"

  sed -E '
    s/[0-9a-f]{7,40}/<HASH>/g;
    s/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:\.\-+Z]+/<TIMESTAMP>/g;
    s/request_id":"[^"]+"/request_id":"<REQUEST_ID>"/g;
    s/"version":"[^"]+"/"version":"<VERSION>"/g;
    s/lead_id=[^&"]+/lead_id=<LEAD_ID>/g;
    s/recommended_package_slug=[^&"]+/recommended_package_slug=<PACKAGE_SLUG>/g;
  ' "$infile" > "$outfile"
}

fetch_route() {
  local base="$1"
  local route="$2"
  local prefix="$3"

  local body="$tmpdir/${prefix}_body"
  local headers="$tmpdir/${prefix}_headers"

  curl -sS -L \
    -D "$headers" \
    -o "$body" \
    "$base$route"

  local status
  status="$(awk 'toupper($1) ~ /^HTTP/ {code=$2} END {print code}' "$headers")"

  echo "$status"
}

echo "Comparing:"
echo "  LOCAL: $LOCAL_BASE"
echo "  PROD : $PROD_BASE"
echo

failures=0

for route in "${ROUTES[@]}"; do
  local_status="$(fetch_route "$LOCAL_BASE" "$route" "local")" || local_status="CURL_ERROR"
  prod_status="$(fetch_route "$PROD_BASE" "$route" "prod")" || prod_status="CURL_ERROR"

  normalize_body "$tmpdir/local_body" "$tmpdir/local_body_norm"
  normalize_body "$tmpdir/prod_body" "$tmpdir/prod_body_norm"

  if diff -q "$tmpdir/local_body_norm" "$tmpdir/prod_body_norm" >/dev/null 2>&1; then
    body_match="MATCH"
  else
    body_match="DIFF"
    failures=$((failures + 1))
  fi

  if [[ "$local_status" != "$prod_status" ]]; then
    status_match="DIFF"
    failures=$((failures + 1))
  else
    status_match="MATCH"
  fi

  printf "%-30s | local=%-12s prod=%-12s | status=%-5s | body=%s\n" \
    "$route" "$local_status" "$prod_status" "$status_match" "$body_match"

  if [[ "$body_match" == "DIFF" ]]; then
    echo "---- body diff preview for $route ----"
    diff -u "$tmpdir/local_body_norm" "$tmpdir/prod_body_norm" | sed -n '1,60p' || true
    echo "--------------------------------------"
  fi
done

echo
if [[ "$failures" -eq 0 ]]; then
  echo "✅ Localhost and production look aligned for the checked routes."
  exit 0
else
  echo "⚠️ Found $failures differences across status/body checks."
  exit 1
fi
