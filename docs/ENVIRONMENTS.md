# Environments Strategy — Smile Transformation

This document defines the 3 official runtime environments: `dev`, `staging`, and `production`.

## Environment overview

| Environment | Git branch | Purpose | Stripe mode | Supabase target |
|---|---|---|---|---|
| Dev | `dev` | Active integration and local tests | Test keys | Dev project/schema |
| Staging | `staging` | Pre-production validation and QA | Test keys | Staging project |
| Production | `main` | Real users and sales | Live keys | Production project |

## Environment-specific setup

## Dev

- Local development and feature integration.
- Use Stripe test keys only.
- Use a dedicated dev Supabase project (or isolated schema).
- Safe place to test AI automation and webhooks with fake data.

## Staging

- Pre-production release candidate verification.
- Use Stripe test mode and staging webhook endpoint.
- Use dedicated staging Supabase project.
- Run smoke tests for:
  - lead capture
  - payment webhook
  - AI queue workers
  - outbound automation worker

## Production

- Uses `main` branch deployments only.
- Live Stripe keys and production webhook secret.
- Production Supabase project and strict RLS posture.
- Strictest security controls and release gates.

## Environment variable structure

Recommended files (never commit real secrets):

- `.env.local` (developer local override)
- `.env.development`
- `.env.staging`
- `.env.production`

Tracked templates:

- `.env.example`
- `.env.local.example`
- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`

## Required variables for all environments

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Optional but recommended

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `AUTOMATION_CRON_SECRET`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `OUTBOUND_EMAIL_FROM`
- `OUTBOUND_WHATSAPP_API_URL`
- `OUTBOUND_WHATSAPP_API_TOKEN`
- `RATE_LIMIT_PROVIDER`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Configuration guidance

1. Keep all environment secrets in Vercel/GitHub/Supabase secret managers.
2. Do not commit `.env.development`, `.env.staging`, or `.env.production`.
3. Use `./scripts/env_check.sh` before deployment to validate required keys.
4. Keep webhook secrets separated per environment.
