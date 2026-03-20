# Production Deployment and Launch Readiness

**Project:** Nebula Smile  
**Owner:** Founder / CTO  
**Stack:** Next.js 16, React 19, TypeScript, Supabase (Postgres, Auth, RLS), Stripe, Vercel, Vitest, Zod  
**Purpose:** Prepare for production deploy and allow the founder to test the full user journey in a live environment.  
**Rules:** No product redesign; no new architecture; no breaking changes; deploy readiness and verification only.

---

## Step 1 — Repository deploy audit

### 1.1 Framework and build system

| Item | Value |
|------|--------|
| **Framework** | Next.js 16 (App Router) |
| **Runtime** | Node 20 (recommended; CI uses 20) |
| **Package manager** | npm |
| **Build system** | Next.js (webpack via `next build --webpack`) |

### 1.2 Commands

| Command | Script | Purpose |
|---------|--------|--------|
| **Build** | `npm run build` | `next build --webpack` — production build |
| **Test** | `npm run test` | `vitest run` — unit/integration tests |
| **Lint** | `npm run lint` | `eslint .` |
| **Verify** | `npm run verify` | `scripts/verify_all.sh` → lint + test + build (removes `.next/lock` before build) |

### 1.3 Deploy readiness

- **CI:** `.github/workflows/ci.yml` runs on push/PR to main, staging, dev, feature/*, hotfix/*: `npm ci`, lint, test, env_check (with placeholder env), build. Job name: `lint-and-build`.
- **Verify:** The repository is **deploy-ready** from a build perspective provided:
  - `npm run verify` succeeds locally (or in CI).
  - Required environment variables are set in Vercel (see Step 2).
  - Migrations are applied in the production Supabase project (see Step 4).
  - Stripe webhook is configured (see Step 5).

**Conclusion:** Repo is structurally ready for deployment. Deployment success depends on env, Supabase, and Stripe configuration.

---

## Step 2 — Environment variables check

### 2.1 Required (must exist in Vercel for production)

| System | Variable | Purpose |
|--------|----------|--------|
| **SUPABASE** | `NEXT_PUBLIC_SUPABASE_URL` | Client: Supabase API URL |
| **SUPABASE** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client: anon key |
| **SUPABASE** | `SUPABASE_URL` | Server: same as above |
| **SUPABASE** | `SUPABASE_SERVICE_ROLE_KEY` | Server: service role key (never expose to client) |
| **STRIPE** | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client: Stripe publishable key (pk_) |
| **STRIPE** | `STRIPE_SECRET_KEY` | Server: Stripe secret key (sk_) |
| **STRIPE** | `STRIPE_WEBHOOK_SECRET` | Server: webhook signing secret (whsec_) — set after creating webhook endpoint |

### 2.2 Optional (used by features if set)

| System | Variable | Purpose |
|--------|----------|--------|
| **APP** | `COMMIT_SHA` | Build/version (Vercel sets `VERCEL_GIT_COMMIT_SHA` / `GITHUB_SHA` automatically) |
| **APP** | `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp CTA button (optional) |
| **SUPABASE** | `DATABASE_URL` | Only for running migrations from your machine; not required in Vercel |
| **OPENAI** | `OPENAI_API_KEY`, `OPENAI_MODEL` | AI features (triage, respond, itinerary, ops) |
| **AUTOMATION** | `AUTOMATION_CRON_SECRET` or `CRON_SECRET` | Cron/worker endpoints (automation worker, outbound worker) |
| **RATE LIMIT** | `RATE_LIMIT_PROVIDER`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Production rate limiting (default: memory) |
| **OUTBOUND** | `RESEND_API_KEY`, `OUTBOUND_EMAIL_FROM`, `OUTBOUND_WHATSAPP_*` | Email/WhatsApp outbound |

**Note:** `NEXT_PUBLIC_APP_URL` is not referenced in the codebase; no need to set it unless you add canonical URL logic later.

### 2.3 Variables that must exist in Vercel

For a working production deploy (landing, auth, leads, checkout, webhook):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (after creating the webhook endpoint in Stripe; then redeploy if added later)

Optional for full feature set: `OPENAI_API_KEY`, `OPENAI_MODEL`, `AUTOMATION_CRON_SECRET` or `CRON_SECRET`.

---

## Step 3 — Vercel deployment preparation

### 3.1 Import GitHub repository

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. **Import Git Repository:** select **GitHub** and authorize if needed; find `cloudsysops/smile-transformation-platform-` (or the repo name as shown).
3. **Import** the repository.
4. Do **not** change Framework Preset (Next.js), Root Directory, or Build Command unless you have a reason. Defaults are correct.

### 3.2 Framework detection

- Vercel detects **Next.js** automatically (preset: Next.js).
- No override needed for this project.

### 3.3 Build command

- **Build Command:** leave default (`npm run build` or `next build`). The project uses `next build --webpack` via `package.json` script `build`.
- **Output Directory:** default (`.next`).
- **Install Command:** default `npm install`; CI uses `npm ci` — both are fine.

### 3.4 Environment variables setup

1. In the Vercel project: **Settings** → **Environment Variables**.
2. Add each variable from Step 2.1 (required) for **Production** (and **Preview** if you want PR previews to work with auth/Stripe).
3. For **Stripe:** use **Test** keys and **test** webhook secret for a test production deploy; switch to **Live** keys and live webhook when going live.
4. After adding or changing **STRIPE_WEBHOOK_SECRET**, trigger a **Redeploy** so the new value is used.

### 3.5 CLI deploy (optional)

If you prefer to deploy from the CLI:

**You must run (in order):**

```bash
vercel login
```

Then from the repo root:

```bash
vercel link          # link to existing project or create new
vercel               # preview deploy
vercel --prod        # production deploy (use with care)
```

- **Safer method:** Deploy via **Git integration** (push to `main` → automatic deploy). That way production is always from a committed state and branch protection can apply. CLI is useful for one-off previews or if you don’t use Git integration.
- **Recommendation:** Use **Git integration** for production; use CLI only for ad-hoc previews or debugging.

---

## Step 4 — Supabase production check

### 4.1 Migration order

Apply migrations in this order (lexicographic 0001 → 0020):

| # | Migration |
|---|-----------|
| 1 | 0001_init.sql |
| 2 | 0002_assets_extended_unified.sql |
| 3 | 0003_m9_ai_admin_connected.sql |
| 4 | 0004_leads_attribution.sql |
| 5 | 0005_lead_ai_ops.sql |
| 6 | 0006_leads_follow_up_queue.sql |
| 7 | 0007_payments_idempotency.sql |
| 8 | 0008_ai_automation_foundation.sql |
| 9 | 0009_ai_automation_jobs.sql |
| 10 | 0010_outbound_messages.sql |
| 11 | 0011_payment_reliability.sql |
| 12 | 0012_payments_idempotency_m19.sql |
| 13 | 0013_specialists_consultations_experiences.sql |
| 14 | 0014_marketplace_providers_packages_experiences.sql |
| 15 | 0015_marketplace_foundation.sql |
| 16 | 0016_curated_network_providers_specialists.sql |
| 17 | 0017_curated_network_enterprise.sql |
| 18 | 0018_profiles_roles_dashboards.sql |
| 19 | 0019_leads_qualification_indexes.sql |
| 20 | 0020_leads_recommended_package.sql |

Then optionally: `scripts/seed_packages.sql`, `scripts/seed_marketplace_foundation.sql`.

### 4.2 How to apply migrations in production

**Option A — Supabase CLI (requires link and login):**

**You must run:**

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

Then from repo root:

```bash
npm run db:migrate
```

**Option B — Supabase Dashboard (no CLI):**

1. Open your project in [app.supabase.com](https://app.supabase.com) → **SQL Editor**.
2. Run each file in `supabase/migrations/` in order (0001 through 0020), one file per query.
3. Then run the seed scripts if desired.

### 4.3 Production database checklist (tables)

After migrations, the database must have (at least) these tables for the app and first test sale:

| Table | Purpose |
|-------|--------|
| **profiles** | Auth + roles (admin, patient, specialist, etc.) |
| **packages** | Catalog (deposit_cents, slug, published) |
| **leads** | Assessment submissions, status, recommended_package_* |
| **payments** | Stripe checkout sessions, status (succeeded, etc.) |
| **providers** | Marketplace providers |
| **specialists** | Specialists (linked to providers) |
| **experiences** | Tourism experiences |
| **bookings** | One per lead when package selected; status updated by webhook |
| **consultations** | Lead–specialist consultations |
| **lead_ai** | AI outputs per lead |
| **itineraries** | Optional itinerary data |
| **ai_automation_jobs** | Automation queue |
| **outbound_messages** | Outbound queue |
| **assets** | Media (optional for launch) |

Also ensure:

- At least one **admin** user: create in **Authentication → Users**, then insert/update `public.profiles` with `role = 'admin'` for that user’s `id`. See [PRIMER_ADMIN](PRIMER_ADMIN.md) or project docs.

---

## Step 5 — Stripe setup

### 5.1 Checkout API route

- **Route:** `app/api/stripe/checkout/route.ts`
- **Method:** POST
- **Auth:** Requires authenticated user (admin or patient). Patient may only pay for leads matching their email.
- **Body:** `lead_id` (UUID); optional `amount_cents`, `success_url`, `cancel_url` (server resolves amount from package; client amount ignored).
- **Response:** `{ url: string }` — redirect user to this URL (Stripe Checkout).

### 5.2 Webhook endpoint

- **Path:** `/api/stripe/webhook`
- **Full URL in production:** `https://<your-vercel-domain>/api/stripe/webhook`
- **Method:** POST
- **Verification:** Uses raw body and `STRIPE_WEBHOOK_SECRET` to verify `stripe-signature`. No processing without valid signature.
- **Event handled:** `checkout.session.completed` (and only when `payment_status === 'paid'`, `mode === 'payment'`).

### 5.3 Configure Stripe Dashboard

1. **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:** `https://<your-production-domain>/api/stripe/webhook` (no trailing slash).
3. **Events to send:** Select **checkout.session.completed**.
4. **Add endpoint**.
5. **Signing secret:** Reveal and copy the value (whsec_...).
6. Add to **Vercel** as `STRIPE_WEBHOOK_SECRET` (Environment Variables).
7. **Redeploy** the project if the secret was added after the last deploy.

### 5.4 How to test the webhook

- **Option A:** In Stripe Dashboard → Webhooks → your endpoint → **Send test webhook** → choose **checkout.session.completed** → Send. Expect **200** response. (Payload may not match a real lead; endpoint may log “invalid metadata” but still return 200.)
- **Option B:** Run the full first test sale (Step 7). After payment, in Stripe → Webhooks → endpoint → **Recent events**, the `checkout.session.completed` event should show **200**. In Supabase, `payments.status = succeeded` and `leads.status = deposit_paid` for that lead.

---

## Step 6 — Production verification

### 6.1 Routes to test

| Route | Expected success |
|-------|------------------|
| **/** | 200; landing page loads. |
| **/packages** | 200; packages listing. |
| **/assessment** | 200; assessment form. |
| **/login** | 200; login form. |
| **/signup** | 200; signup form. |
| **/admin** | 302 to login if not authenticated; 200 and admin overview if authenticated as admin. |
| **/patient** | 302 to login if not authenticated; 200 and patient dashboard if authenticated as patient. |

### 6.2 API endpoints

| Endpoint | Expected success |
|----------|------------------|
| **GET /api/health** | 200; body `{ ok: true, status: "ok", ... }`. |
| **GET /api/health/ready** | 200 if Supabase config present and DB reachable; body `{ ready: true, checks: { supabase_config: "ok", supabase_connect: "ok" } }`. 503 if config missing or DB unreachable. |

### 6.3 Verification script

From repo root (replace with your production URL):

```bash
./scripts/deploy_verify.sh https://<your-production-domain>
```

This checks GET `/` and GET `/api/health` return 200.

---

## Step 7 — First test sale

End-to-end flow for the founder to validate the live journey.

1. **User signup (optional for this path)**  
   - Go to **/signup**. Create account with email + password.  
   - Or skip and only use admin for collect deposit.

2. **User completes assessment**  
   - Go to **/** → **Free Smile Evaluation** (or **/assessment**).  
   - Fill first name, last name, email (required); optionally package, phone, country.  
   - Submit. Redirect to **/thank-you?lead_id=...**.

3. **Lead created**  
   - In Supabase **Table Editor** → **leads**, or in **Admin** → **Leads**, confirm the new row.

4. **Admin reviews lead**  
   - Go to **/login**. Sign in with admin user.  
   - Open **Leads** → open the new lead.

5. **Admin recommends package**  
   - On lead detail, use **Recommend package** and select a package (if not already set). Save.

6. **Admin collects deposit**  
   - In **Stripe deposit** section, click **Collect deposit**.  
   - You are redirected to Stripe Checkout.

7. **Stripe checkout**  
   - Use test card **4242 4242 4242 4242**, any future expiry (e.g. 12/34), any CVC (e.g. 123).  
   - Complete payment. Redirect back to app (e.g. `/admin/leads/<id>?paid=1`).

8. **Verify database**  
   - **payments:** row for this lead has `status = succeeded`, `stripe_checkout_session_id` set.  
   - **leads:** same lead has `status = deposit_paid`.

See [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) for full steps and troubleshooting.

---

## Step 8 — Deployment command flow

### 8.1 Local verification

```bash
npm run verify
```

Must complete with exit code 0 (lint, test, build). Fix any failure before deploying.

### 8.2 Git workflow

```bash
git add .
git status
git commit -m "production readiness"
git push origin <branch-name>
```

Use the branch that Vercel deploys from (e.g. `main`). If you use PRs:

```bash
gh pr create --base main --head <branch-name>
```

After review and merge to `main`, Vercel will deploy from `main` (if Git integration is configured).

### 8.3 After merge

- Vercel automatically builds and deploys from `main` (when connected).  
- Ensure all required env vars are set in Vercel for Production.  
- After first deploy, configure Stripe webhook URL and set `STRIPE_WEBHOOK_SECRET`, then redeploy if needed.

---

## Step 9 — Final report

### 1. Deploy readiness summary

- **Build:** Next.js 16, `npm run build`; CI runs lint, test, env_check, build.
- **Repo:** No product or architecture changes required for deploy; structure is deploy-ready.
- **Blockers for a successful production run:** (1) Required env vars in Vercel, (2) Supabase migrations applied and at least one admin user, (3) Stripe webhook endpoint created and secret set in Vercel.

### 2. Environment variables checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`  
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- [ ] `SUPABASE_URL`  
- [ ] `SUPABASE_SERVICE_ROLE_KEY`  
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
- [ ] `STRIPE_SECRET_KEY`  
- [ ] `STRIPE_WEBHOOK_SECRET` (after webhook created)  
- [ ] Optional: `OPENAI_API_KEY`, `OPENAI_MODEL`, `AUTOMATION_CRON_SECRET` or `CRON_SECRET`

### 3. Vercel deploy instructions

- Import repo from GitHub (Settings → Add New → Project).  
- Leave Framework (Next.js), Build Command, Output as default.  
- Set all required environment variables for Production (and Preview if needed).  
- Deploy from `main`. After adding webhook secret, redeploy.  
- Prefer **Git integration** over CLI for production.

### 4. Supabase production checklist

- [ ] Migrations 0001–0020 applied in order (CLI `npm run db:migrate` or SQL Editor).  
- [ ] Optional: seed_packages.sql, seed_marketplace_foundation.sql.  
- [ ] At least one admin user (Auth + profiles.role = 'admin').  
- [ ] Tables present: profiles, packages, leads, payments, providers, specialists, experiences, bookings, consultations, and any other required by the app.

### 5. Stripe webhook setup

- [ ] Create endpoint in Stripe: `https://<domain>/api/stripe/webhook`.  
- [ ] Event: `checkout.session.completed`.  
- [ ] Copy signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.  
- [ ] Redeploy if secret was added after deploy.  
- [ ] Test: “Send test webhook” → 200, or complete a test payment and verify DB.

### 6. First test sale procedure

- Follow Step 7 above (assessment → lead → admin review → recommend package → collect deposit → 4242 4242 4242 4242 → verify payments and leads in DB).  
- Full guide: [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md).

### 7. Command sequence

```bash
# Local
npm run verify

# Git (example: push to main or your deploy branch)
git add .
git commit -m "production readiness"
git push origin main

# Or via PR
git checkout -b chore/production-readiness
git add .
git commit -m "production readiness"
git push origin chore/production-readiness
gh pr create --base main --head chore/production-readiness
# After merge → Vercel deploys
```

**External steps (founder must do):**

- **Vercel:** Import repo, set env vars, deploy (or connect Git and push).  
- **Supabase:** Apply migrations, create admin user.  
- **Stripe:** Create webhook endpoint, set secret in Vercel, redeploy if needed.

### 8. Final recommendation

**SAFE TO DEPLOY** from a code and structure perspective, provided:

1. You run `npm run verify` and it passes.  
2. You configure Vercel (env vars and, if new, project from GitHub).  
3. You apply Supabase migrations and create an admin user.  
4. You configure the Stripe webhook and set `STRIPE_WEBHOOK_SECRET`.  
5. You run through the first test sale (Step 7) and confirm `payments.status = succeeded` and `leads.status = deposit_paid`.

No code changes were made in this audit; only analysis and the deployment plan above.
