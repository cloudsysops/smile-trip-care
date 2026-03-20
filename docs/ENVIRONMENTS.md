# Environments — MedVoyage Smile

Two-environment strategy for pre-launch and early production: **Production** and **Staging/Preview**. No overengineering; safe separation for validating first sales and showing the product to investors while iterating quickly.

---

## 1. Environment model

| Environment   | Purpose                          | Branch(es)     | Supabase project | Stripe mode |
|---------------|----------------------------------|----------------|------------------|-------------|
| **Production**| Live app, first sales, investors | `main`         | Production       | Test (then Live when ready) |
| **Staging/Preview** | PR checks, QA, demos without touching prod data | All other branches, PRs | Staging | Test only |

- **One Vercel project** is enough: use **Production** and **Preview** environment variables so `main` uses prod Supabase + prod Stripe config, and preview deployments use staging Supabase + test Stripe.
- **Two Supabase projects**: one for Production, one for Staging. Same schema (migrations) in both; Staging can have seed data and test leads.
- **Stripe**: Use **Test mode** for both environments at first. When going live for real payments, switch Production to **Live** keys and add a Live webhook endpoint; Staging stays on Test.

---

## 2. Required env vars per environment

Same variable **names** everywhere; **values** differ by environment.

### Production (Vercel → Production)

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Production anon key |
| `SUPABASE_URL` | Yes | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Production service_role key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe **Test** (pk_test_) until you go Live; then pk_live_ |
| `STRIPE_SECRET_KEY` | Yes | Stripe **Test** (sk_test_) until Live; then sk_live_ |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook for **production URL** (whsec_...) |

Optional: `OPENAI_API_KEY`, `OPENAI_MODEL`, `AUTOMATION_CRON_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` (custom domain), `NEXT_PUBLIC_WHATSAPP_NUMBER`, etc.

### Staging / Preview (Vercel → Preview)

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | **Staging** Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Staging anon key |
| `SUPABASE_URL` | Yes | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Staging service_role key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe **Test** (pk_test_) |
| `STRIPE_SECRET_KEY` | Yes | Stripe **Test** (sk_test_) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook for **preview URL** (see [DEPLOYMENT_STRATEGY.md](DEPLOYMENT_STRATEGY.md)) |

Use **Test mode** only for Staging; never use Live keys in Preview.

---

## 3. Which Stripe mode per environment

| Environment | Stripe mode | When |
|-------------|-------------|------|
| **Production** | **Test** | Pre-launch, validating first sales, investor demos |
| **Production** | **Live** | When accepting real payments |
| **Staging/Preview** | **Test** only | Always |

---

## 4. Which Supabase project each environment uses

| Environment   | Supabase project | Notes |
|---------------|------------------|--------|
| **Production**| Production project | Migrations applied; packages seed; real or test leads as you choose |
| **Staging/Preview** | Staging project | Migrations applied; seed data; test leads only |

Founder creates both projects in Supabase and applies the same migrations to both. Run packages-only (or marketplace foundation) seed on Production when going live; Staging can use the same seed for demos.

---

## 5. Local development

- Use **one** Supabase project locally (e.g. Staging or a separate dev project) and **Stripe Test**.
- Copy `.env.example` to `.env.local` and set values. Run `./scripts/check_env.sh` to validate.
- See [LOCAL_SETUP.md](LOCAL_SETUP.md) and [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md).

---

## 6. References

- [DEPLOYMENT_STRATEGY.md](DEPLOYMENT_STRATEGY.md) — Vercel mapping, Supabase mapping, Stripe mapping, founder checklist
- [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) — Stripe and Supabase setup
- [VERCEL_SETUP.md](VERCEL_SETUP.md) — Vercel env vars and deploy
