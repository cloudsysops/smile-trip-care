# Vercel pre-deploy checklist — Nebula Smile

Use this checklist before and after deploying to Vercel.

---

## Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production and Preview if needed).

### Required for app + DB

| Variable | Required | Where to get it |
|----------|----------|------------------|
| `SUPABASE_URL` | Yes | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Same → service_role key (secret) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same → anon public key |

### Required for Stripe (checkout + webhook)

| Variable | Required | Where to get it |
|----------|----------|------------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe Dashboard → API keys (sk_...) |
| `STRIPE_WEBHOOK_SECRET` | Yes | After adding webhook endpoint (whsec_...) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe → API keys (pk_...) |

### Optional (AI agents in admin)

| Variable | Required | Notes |
|----------|----------|--------|
| `OPENAI_API_KEY` | No | Only if using AI triage/respond/itinerary in prod |
| `OPENAI_MODEL` | No | e.g. gpt-4o-mini |

### Build-time (Vercel sets or allow empty for build)

- `NEXT_PUBLIC_*` must be set for client-side features (auth, Stripe checkout UI). CI uses empty values for build; Vercel must have real values for production.

---

## Pre-deploy verification (local)

1. **Run full pipeline**
   ```bash
   npm run verify
   ```
   Must pass: lint, test, build.

2. **Run smoke test (local)**  
   With app running (`npm run dev`):
   ```bash
   ./scripts/smoke_test.sh http://localhost:3000
   ```
   Both `/api/health` and `/api/health/ready` must return 200 (ready may be 503 if Supabase env not set).

3. **Confirm no secrets in client**
   - `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY` are only read in server code (API routes, server components). Never in `NEXT_PUBLIC_*` or client bundles.

---

## Post-deploy verification (Vercel)

1. **Smoke test production**
   ```bash
   ./scripts/smoke_test.sh https://YOUR_VERCEL_URL.vercel.app
   ```
   Or full verification (health, ready, status, landing):
   ```bash
   ./scripts/verify_production.sh https://YOUR_VERCEL_URL.vercel.app
   ```
   Both `/api/health` and `/api/health/ready` must return 200.

2. **Stripe webhook**
   - Stripe Dashboard → Webhooks → Add endpoint: `https://YOUR_VERCEL_URL/api/stripe/webhook`, event `checkout.session.completed`.
   - Add signing secret to Vercel as `STRIPE_WEBHOOK_SECRET`, then redeploy if needed.
   - Send test webhook or complete a test payment; confirm 200 and DB update.

3. **Manual flow**
   - Submit assessment → create lead → admin: request deposit → complete Stripe Checkout → confirm payment and lead status in Supabase.

---

## Verification steps summary

| Step | Command / action |
|------|------------------|
| Lint | `npm run lint` |
| Test | `npm run test` |
| Build | `npm run build` |
| Verify all | `npm run verify` |
| Smoke (local) | `./scripts/smoke_test.sh http://localhost:3000` |
| Smoke (prod) | `./scripts/smoke_test.sh https://<your-vercel-url>` |
| Verify prod (full) | `./scripts/verify_production.sh https://<your-vercel-url>` |
| Health | `GET /api/health` → 200 |
| Ready | `GET /api/health/ready` → 200 (when Supabase configured) |
| Status | `GET /api/status` → 200, `{ "app", "status", "version" }` |

---

*See also: [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md), [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md).*
