# Environment strategy — Nebula Smile

How environment variables are organized, required vs optional, and where they are used. No secrets are stored in the repo.

---

## Strategy

1. **Single source of shape:** `.env.example` defines groups and placeholders.
2. **Local:** Copy to `.env.local` and set values; never commit `.env.local`.
3. **Production (Vercel):** Set same names in Project → Environment Variables; no secrets in code.
4. **Secrets stay server-side:** No `NEXT_PUBLIC_*` for keys or tokens; only for non-sensitive URLs/IDs (e.g. Supabase URL, Stripe publishable key).

---

## Groups (by concern)

| Group | Required for app run | Where used |
|-------|----------------------|------------|
| **App** | No | Build metadata (e.g. COMMIT_SHA) |
| **Supabase** | Yes | Auth, DB, server and client |
| **Stripe** | Yes | Checkout, webhook |
| **Vercel** | Auto-injected on Vercel | Build/runtime (VERCEL_URL, VERCEL_ENV) |
| **GitHub** | No (CI only) | Actions; not in .env.local |
| **Terraform** | No | Only when running Terraform; use CI or local env |
| **Kafka** | No | Optional; only if using event-driven features |
| **Sentry** | No | Optional; when error monitoring is added |

---

## Required for local run

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stripe:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Validation: `make check-env` or `./scripts/check_env.sh`.

---

## Optional (common)

- **OpenAI:** `OPENAI_API_KEY`, `OPENAI_MODEL` — AI features
- **Automation:** `AUTOMATION_CRON_SECRET`, `CRON_SECRET` — cron/worker endpoints
- **Rate limiting:** `RATE_LIMIT_PROVIDER`, Upstash vars — production rate limit
- **Outbound:** Resend, WhatsApp — email/SMS
- **Sentry:** `SENTRY_DSN`, etc. — when Sentry is integrated
- **Kafka:** `KAFKA_BOOTSTRAP_SERVERS` — when using Kafka

---

## References

- **.env.example** — full grouped list in repo root
- [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) — Stripe and Supabase details
- [LOCAL_SETUP.md](LOCAL_SETUP.md) — local bootstrap
- [VERCEL_SETUP.md](VERCEL_SETUP.md) — production env
