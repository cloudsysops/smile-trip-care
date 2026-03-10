#!/usr/bin/env bash
set -e

LOCAL_BASE=${LOCAL_BASE:-http://localhost:3000}
PROD_BASE=${PROD_BASE:-https://smile-transformation-platform-dev.vercel.app}

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

echo "Comparing LOCAL vs PROD"
echo "LOCAL: $LOCAL_BASE"
echo "PROD : $PROD_BASE"
echo ""

extract_meta() {
  grep -iE "<title>|meta name=\"description\"|property=\"og:" "$1" \
    | sed -E 's/[0-9a-f]{7,40}/HASH/g'
}

check_route() {
  ROUTE=$1
  LOCAL_FILE="$TMP_DIR/local.html"
  PROD_FILE="$TMP_DIR/prod.html"
  LOCAL_HEADERS="$TMP_DIR/local_headers"
  PROD_HEADERS="$TMP_DIR/prod_headers"

  curl -sS -L -D "$LOCAL_HEADERS" -o "$LOCAL_FILE" "$LOCAL_BASE$ROUTE"
  curl -sS -L -D "$PROD_HEADERS" -o "$PROD_FILE" "$PROD_BASE$ROUTE"

  LOCAL_STATUS=$(awk 'toupper($1) ~ /^HTTP/ {code=$2} END {print code}' "$LOCAL_HEADERS")
  PROD_STATUS=$(awk 'toupper($1) ~ /^HTTP/ {code=$2} END {print code}' "$PROD_HEADERS")

  echo "------------------------------------"
  echo "Route: $ROUTE"
  echo "Local Status: $LOCAL_STATUS"
  echo "Prod  Status: $PROD_STATUS"

  if [ "$LOCAL_STATUS" != "$PROD_STATUS" ]; then
    echo "⚠ STATUS DIFFERENT"
  fi

  LOCAL_META=$(extract_meta "$LOCAL_FILE" 2>/dev/null || true)
  PROD_META=$(extract_meta "$PROD_FILE" 2>/dev/null || true)

  if [ "$LOCAL_META" == "$PROD_META" ]; then
    echo "✓ META MATCH"
  else
    echo "⚠ META DIFFERENCE"
    echo "Local:"
    echo "$LOCAL_META"
    echo "Prod:"
    echo "$PROD_META"
  fi
}

for ROUTE in "${ROUTES[@]}"; do
  check_route "$ROUTE"
done

echo ""
echo "Comparison complete."
