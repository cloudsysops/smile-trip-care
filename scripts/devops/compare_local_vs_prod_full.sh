#!/usr/bin/env bash
# Compare localhost vs production for SmileTripCare (HTTP status + SEO metadata).
# Usage: run with local server up (e.g. npm run build && npm start), then:
#   ./scripts/devops/compare_local_vs_prod_full.sh

set -e

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
  "/dental-implants-colombia"
  "/veneers-colombia"
  "/hollywood-smile-colombia"
)

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# Normalize dynamic values in extracted meta (hashes, timestamps, etc.)
normalize() {
  sed -E '
    s/[0-9a-f]{7,40}/<HASH>/g;
    s/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:\.\-+Z]+/<TIMESTAMP>/g;
  '
}

# Extract <title>, meta description, and OpenGraph tags; one line per match, normalized
extract_meta() {
  local file="$1"
  {
    grep -iEo '<title>[^<]*</title>' "$file" 2>/dev/null || true
    grep -iEo '<meta[^>]*name="description"[^>]*>' "$file" 2>/dev/null || true
    grep -iEo '<meta[^>]*content="[^"]*"[^>]*name="description"[^>]*>' "$file" 2>/dev/null || true
    grep -iEo '<meta[^>]*property="og:[^"]*"[^>]*>' "$file" 2>/dev/null || true
    grep -iEo '<meta[^>]*content="[^"]*"[^>]*property="og:[^"]*"[^>]*>' "$file" 2>/dev/null || true
  } | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sort -u | normalize
}

fetch_route() {
  local base="$1"
  local route="$2"
  local prefix="$3"
  local out="$TMP_DIR/${prefix}_body"
  local hdr="$TMP_DIR/${prefix}_hdr"
  curl -sS -L -D "$hdr" -o "$out" "$base$route"
  awk 'toupper($1) ~ /^HTTP/ {code=$2} END {print code}' "$hdr"
}

echo "=============================================="
echo "  SmileTripCare — Local vs Prod Comparison"
echo "=============================================="
echo "  LOCAL: $LOCAL_BASE"
echo "  PROD : $PROD_BASE"
echo "=============================================="
echo ""

printf "%-28s | %-6s | %-6s | %-8s\n" "route" "local" "prod" "meta"
printf "%-28s-+-%-6s-+-%-6s-+-%-8s\n" "----------------------------" "------" "------" "--------"

failures=0
for route in "${ROUTES[@]}"; do
  local_status=$(fetch_route "$LOCAL_BASE" "$route" "local") || local_status="ERR"
  prod_status=$(fetch_route "$PROD_BASE" "$route" "prod") || prod_status="ERR"

  local_meta=$(extract_meta "$TMP_DIR/local_body")
  prod_meta=$(extract_meta "$TMP_DIR/prod_body")

  if [ "$local_meta" = "$prod_meta" ]; then
    meta_result="MATCH"
  else
    meta_result="DIFF"
    failures=$((failures + 1))
  fi

  if [ "$local_status" != "$prod_status" ]; then
    failures=$((failures + 1))
  fi

  printf "%-28s | %-6s | %-6s | %-8s\n" "$route" "$local_status" "$prod_status" "$meta_result"

  if [ "$meta_result" = "DIFF" ]; then
    echo "  --- local meta ---"
    echo "$local_meta" | sed 's/^/    /'
    echo "  --- prod meta ---"
    echo "$prod_meta" | sed 's/^/    /'
    echo "  ---"
  fi
done

echo ""
echo "=============================================="
if [ "$failures" -eq 0 ]; then
  echo "  ✅ All routes: status and SEO meta match."
else
  echo "  ⚠️  $failures difference(s) found above."
fi
echo "=============================================="

exit $failures
