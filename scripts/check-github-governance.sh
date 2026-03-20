#!/usr/bin/env bash
set -euo pipefail

OWNER="cloudsysops"
REPO="smile-transformation-platform-"
BRANCH="main"

EXPECTED_CHECK_1="CI / lint-and-build"
EXPECTED_CHECK_2="security / secret-scan"
EXPECTED_APPROVALS=1

echo "→ Verificando autenticación de GitHub CLI..."
gh auth status >/dev/null

echo "→ Consultando branch protection para $OWNER/$REPO ($BRANCH)..."
PROTECTION_JSON="$(gh api "repos/$OWNER/$REPO/branches/$BRANCH/protection" -H "Accept: application/vnd.github+json")"

echo "→ Analizando configuración..."

PASS=true

has_pr_required="$(echo "$PROTECTION_JSON" | jq -r '.required_pull_request_reviews != null')"
approvals="$(echo "$PROTECTION_JSON" | jq -r '.required_pull_request_reviews.required_approving_review_count // 0')"
strict="$(echo "$PROTECTION_JSON" | jq -r '.required_status_checks.strict // false')"
enforce_admins="$(echo "$PROTECTION_JSON" | jq -r '.enforce_admins.enabled // false')"
conversation_resolution="$(echo "$PROTECTION_JSON" | jq -r '.required_conversation_resolution.enabled // false')"
contexts="$(echo "$PROTECTION_JSON" | jq -r '.required_status_checks.contexts[]?')"

echo ""
echo "=== GitHub Governance Check ==="

if [[ "$has_pr_required" == "true" ]]; then
  echo "OK   PR required"
else
  echo "FAIL PR required is not enabled"
  PASS=false
fi

if [[ "$approvals" -ge "$EXPECTED_APPROVALS" ]]; then
  echo "OK   Required approvals: $approvals"
else
  echo "FAIL Required approvals: expected >= $EXPECTED_APPROVALS, got $approvals"
  PASS=false
fi

if [[ "$strict" == "true" ]]; then
  echo "OK   Branch must be up to date before merge"
else
  echo "FAIL strict status checks are not enabled"
  PASS=false
fi

if echo "$contexts" | grep -Fxq "$EXPECTED_CHECK_1"; then
  echo "OK   Required check present: $EXPECTED_CHECK_1"
else
  echo "FAIL Missing required check: $EXPECTED_CHECK_1"
  PASS=false
fi

if echo "$contexts" | grep -Fxq "$EXPECTED_CHECK_2"; then
  echo "OK   Required check present: $EXPECTED_CHECK_2"
else
  echo "FAIL Missing required check: $EXPECTED_CHECK_2"
  PASS=false
fi

if [[ "$enforce_admins" == "true" ]]; then
  echo "OK   Admins are also enforced"
else
  echo "WARN Admin enforcement is disabled"
fi

if [[ "$conversation_resolution" == "true" ]]; then
  echo "OK   Conversation resolution required"
else
  echo "WARN Conversation resolution is not required"
fi

echo ""
echo "Required checks found:"
echo "$contexts" | sed 's/^/ - /'

echo ""
if [[ "$PASS" == "true" ]]; then
  echo "✅ Governance configuration looks correct."
  exit 0
else
  echo "❌ Governance configuration mismatch detected."
  exit 1
fi

