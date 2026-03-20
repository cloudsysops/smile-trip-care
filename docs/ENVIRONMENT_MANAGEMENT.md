# Environment management

How env vars are grouped and where they are used. **No secrets are stored in the repo.**

---

## .env.example groups

| Group | Purpose | Required for |
|-------|--------|--------------|
| **App** | Next.js / runtime metadata | Build (optional COMMIT_SHA) |
| **Supabase** | Database, Auth | Local run, Vercel deploy |
| **Stripe** | Payments, webhooks | Checkout and webhook handler |
| **OpenAI** | AI features | Optional |
| **Vercel** | Set in Dashboard for deploys | Deploy (auto-injected vars) |
| **Automation** | Cron/worker endpoints | Optional (workers) |
| **Rate limiting** | Upstash or memory | Optional (production: Upstash) |
| **Outbound** | Email, WhatsApp | Optional |
| **Kafka** | Event bus (optional) | Only if using Kafka |
| **GitHub** | CI; not in .env.local | Actions |
| **Terraform** | Infra provisioning | Only when running Terraform |

Full list and examples: **.env.example** in repo root.

---

## Required for local run

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Validation: `./scripts/check_env.sh` or `make check-env`.

---

## Required for production (Vercel)

Same as above, plus any optional vars you enable (e.g. `OPENAI_API_KEY`, `AUTOMATION_CRON_SECRET`). See [VERCEL_SETUP.md](VERCEL_SETUP.md) and [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md).

---

## References

- [LOCAL_SETUP.md](LOCAL_SETUP.md) — local bootstrap
- [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) — Stripe and Supabase details
- [STRIPE_LOCAL_SETUP.md](STRIPE_LOCAL_SETUP.md) — local webhook secret
