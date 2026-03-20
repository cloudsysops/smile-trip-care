#!/usr/bin/env bash
set -euo pipefail

# Compare localhost vs production route-by-route for SmileTripCare.
# Usage: ensure local server is running (e.g. npm run build && npm start), then:
#   ./scripts/devops/compare_local_vs_prod.sh

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
  curl -sS -L -D "$headers" -o "$body" "$base$route"
  awk 'toupper($1) ~ /^HTTP/ {code=$2} END {print code}' "$headers"
}

echo "Comparing:"
echo "  LOCAL: $LOCAL_BASE"
echo "  PROD : $PROD_BASE"
echo
printf "%-30s | %-12s | %-12s | %-8s | %-8s\n" "route" "local" "prod" "status" "body"
printf "%-30s-+-%-12s-+-%-12s-+-%-8s-+-%-8s\n" "------------------------------" "------------" "------------" "--------" "--------"

failures=0
for route in "${ROUTES[@]}"; do
  local_status="$(fetch_route "$LOCAL_BASE" "$route" "local")" || local_status="CURL_ERR"
  prod_status="$(fetch_route "$PROD_BASE" "$route" "prod")" || prod_status="CURL_ERR"

  normalize_body "$tmpdir/local_body" "$tmpdir/local_norm"
  normalize_body "$tmpdir/prod_body" "$tmpdir/prod_norm"

  if diff -q "$tmpdir/local_norm" "$tmpdir/prod_norm" >/dev/null 2>&1; then
    body_match="MATCH"
  else
    body_match="DIFF"
    failures=$((failures + 1))
  fi

  if [[ "$local_status" == "$prod_status" ]]; then
    status_match="MATCH"
  else
    status_match="DIFF"
    failures=$((failures + 1))
  fi

  printf "%-30s | %-12s | %-12s | %-8s | %-8s\n" \
    "$route" "$local_status" "$prod_status" "$status_match" "$body_match"

  if [[ "$body_match" == "DIFF" ]]; then
    echo "  ---- diff preview for $route ----"
    diff -u "$tmpdir/local_norm" "$tmpdir/prod_norm" 2>/dev/null | sed -n '1,40p' || true
    echo "  ---------------------------------"
  fi
done

echo
if [[ "$failures" -eq 0 ]]; then
  echo "✅ All routes aligned (status + body) between local and prod."
  exit 0
else
  echo "⚠️ $failures difference(s) found. Review above."
  exit 1
fi
