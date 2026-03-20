#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

load_env_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$file"
    set +a
  fi
}

load_env_file ".env"
load_env_file ".env.local"

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
)

optional_vars=(
  "OPENAI_API_KEY"
  "OPENAI_MODEL"
  "AUTOMATION_CRON_SECRET"
  "CRON_SECRET"
  "RESEND_API_KEY"
  "OUTBOUND_EMAIL_FROM"
  "OUTBOUND_WHATSAPP_API_URL"
  "OUTBOUND_WHATSAPP_API_TOKEN"
  "COMMIT_SHA"
  "RATE_LIMIT_PROVIDER"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
)

missing_required=()
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    missing_required+=("$var_name")
  fi
done

if [[ "${RATE_LIMIT_PROVIDER:-}" == "upstash" ]]; then
  for var_name in "UPSTASH_REDIS_REST_URL" "UPSTASH_REDIS_REST_TOKEN"; do
    if [[ -z "${!var_name:-}" ]]; then
      missing_required+=("$var_name")
    fi
  done
fi

if (( ${#missing_required[@]} > 0 )); then
  echo "Missing required environment variables:"
  printf ' - %s\n' "${missing_required[@]}"
  exit 1
fi

echo "Required environment variables: OK"

missing_optional=()
for var_name in "${optional_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    missing_optional+=("$var_name")
  fi
done

if (( ${#missing_optional[@]} > 0 )); then
  echo "Optional variables not set (non-blocking):"
  printf ' - %s\n' "${missing_optional[@]}"
fi
