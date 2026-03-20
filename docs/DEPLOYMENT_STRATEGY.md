# Deployment strategy — MedVoyage Smile

Two-environment setup: **Production** and **Staging/Preview**. This doc gives exact mappings and what the founder must create manually. No infrastructure is provisioned by code; documentation only.

---

## 1. Recommended environment model

| Environment       | Purpose                    | Deploys from     | Data (Supabase) | Payments (Stripe) |
|-------------------|----------------------------|------------------|------------------|-------------------|
| **Production**    | Live app, first sales, investors | Branch `main`    | Production project | Test now; Live when ready |
| **Staging/Preview** | PR checks, QA, demos      | All other branches & PRs | Staging project | Test only |

- **One Vercel project** with two **environments** (Production and Preview). No need for two Vercel projects.
- **Two Supabase projects**: Production and Staging. Same schema; different data.
- **Stripe**: One Stripe account. Test mode for both environments at first; add Live for Production when you go live.

---

## 2. Exact Vercel mapping

- **Production**
  - **Branch:** `main` only.
  - **Vercel:** Settings → Git → **Production Branch** = `main`.
  - **Result:** Every push to `main` builds and deploys as **Production**. URL: your production domain (e.g. `https://nebulasmile.com` or `https://smile-transformation-platform-dev.vercel.app`).
  - **Environment variables:** In Vercel, set variables and select **Production** so they apply only to Production deployments.

- **Preview (Staging)**
  - **Branches:** All other branches (e.g. `staging`, `develop`, `feature/*`, `fix/*`) and every **Pull Request**.
  - **Vercel:** Default behavior: non-production branches and PRs get **Preview** deployments.
  - **Result:** Each PR or push to a non-main branch gets a unique Preview URL (e.g. `https://smile-transformation-platform-xxx.vercel.app`).
  - **Environment variables:** In Vercel, set the same variable names and select **Preview** (and optionally **Development** if you use `vercel dev`), with **Staging** Supabase and **Test** Stripe values.

Summary:

| Vercel environment | Branch / trigger      | URL type        | Env vars scope   |
|--------------------|------------------------|-----------------|------------------|
| Production         | `main`                 | Production URL  | Production only  |
| Preview            | All other branches, PRs | Preview URLs    | Preview only     |

---

## 3. Exact Supabase mapping

- **Production**
  - **Project:** One dedicated Supabase project (e.g. “Nebula Smile Production”).
  - **Used by:** Vercel **Production** deployments only (env vars point to this project’s URL and keys).
  - **Migrations:** Apply all migrations (0001 through 0020). Run packages-only (or marketplace foundation) seed when going live.
  - **Auth:** Create at least one admin user for production.

- **Staging**
  - **Project:** One dedicated Supabase project (e.g. “MedVoyage Smile Staging”).
  - **Used by:** Vercel **Preview** deployments and (optionally) local dev.
  - **Migrations:** Same as Production. Seed as needed for demos/QA.
  - **Auth:** Create at least one admin user for staging.

Do **not** point Production deployments at the Staging project or the reverse. Each environment has exactly one Supabase project.

| Environment       | Supabase project | Vercel env vars target |
|-------------------|------------------|-------------------------|
| Production        | Production project | Production variables    |
| Staging/Preview   | Staging project  | Preview variables      |

---

## 4. Exact Stripe mapping

- **Stripe account:** One account. Use **Test mode** for both environments initially.

- **Production (Vercel Production)**
  - **Keys:** Stripe **Test** (pk_test_..., sk_test_...) until you switch to real payments.
  - **Webhook:** One endpoint: `https://<production-domain>/api/stripe/webhook` (e.g. `https://nebulasmile.com/api/stripe/webhook`). Event: `checkout.session.completed`. Copy **Signing secret** (whsec_...) into Vercel **Production** as `STRIPE_WEBHOOK_SECRET`.
  - When going **Live:** Create Live keys and a **second** webhook for the same production URL, then switch Production env vars to Live keys and the new webhook secret.

- **Staging/Preview (Vercel Preview)**
  - **Keys:** Same Stripe **Test** keys (pk_test_..., sk_test_...) as used for pre-live Production, or a separate Test key set if you prefer.
  - **Webhook:** Preview URLs change per deployment. Options:
    - **Option A:** Add one webhook per stable preview URL (e.g. a permanent staging URL if you use a fixed branch like `staging`), and use that URL’s signing secret in Vercel **Preview**.
    - **Option B:** Do not set a webhook for random preview URLs; use Stripe CLI to forward events locally for PR testing, and accept that Preview deployments may not receive webhooks unless you configure a known staging URL.

Recommendation: use **Option A** with a single stable Staging URL (e.g. from a `staging` branch) and one Stripe Test webhook for that URL; set that secret in Vercel Preview.

| Environment       | Stripe mode | Webhook URL (example)                    | Env vars target   |
|-------------------|------------|------------------------------------------|-------------------|
| Production        | Test → Live when ready | `https://<prod-domain>/api/stripe/webhook` | Production only   |
| Staging/Preview   | Test only  | `https://<staging-preview-url>/api/stripe/webhook` (if used) | Preview only      |

---

## 5. What the founder must create manually

Do **not** provision real infrastructure from code in this step; do the following by hand.

1. **Vercel**
   - One project connected to the repo.
   - Production branch = `main`.
   - **Production** environment variables: Supabase Production URL + anon + service_role; Stripe Test (or Live) keys + webhook secret for production URL.
   - **Preview** environment variables: Supabase Staging URL + anon + service_role; Stripe Test keys + webhook secret for staging URL (if using a stable staging URL).
   - Optional: custom domain for Production.

2. **Supabase**
   - **Production project:** Create project, apply migrations (0001–0020), run packages seed when going live, create at least one admin user. Copy API URL and anon + service_role keys into Vercel Production.
   - **Staging project:** Create project, apply same migrations, run seed if desired, create at least one admin user. Copy API URL and anon + service_role keys into Vercel Preview.

3. **Stripe**
   - **Test mode:** Create webhook for production domain (`/api/stripe/webhook`, event `checkout.session.completed`). Copy signing secret into Vercel Production.
   - If using a stable staging URL: create a second Test webhook for that URL; copy its signing secret into Vercel Preview.
   - When going live: create Live keys and Live webhook for production URL; update only Production env vars to Live keys and new secret.

4. **Documentation**
   - Keep a private list of which Supabase project is Production vs Staging and which Stripe webhook/keys belong to which environment, so you don’t mix them.

---

## 6. What can be automated later

- **Migrations:** Script or CI job that runs migrations against a target (e.g. `DATABASE_URL` for Production or Staging) with approval.
- **Seed:** Script to run packages-only or marketplace seed against a given Supabase project (with confirmation).
- **Env validation:** CI step that checks required env vars exist for Production (e.g. in a deploy workflow); optional check for Preview.
- **Smoke tests:** After deploy, run `GET /api/health` and optionally a minimal checkout flow against a chosen environment.
- **Second Vercel project:** If you later want a completely separate “Staging” project (separate from Preview), you can add a second Vercel project linked to a `staging` branch and configure its env to point to Staging Supabase + Test Stripe.

---

## 7. Quick reference

| Item | Production | Staging/Preview |
|------|------------|-----------------|
| **Vercel** | Branch `main` → Production env vars | Other branches & PRs → Preview env vars |
| **Supabase** | Production project | Staging project |
| **Stripe** | Test (then Live); webhook for prod URL | Test only; webhook for staging URL if used |
| **Founder** | Create prod Supabase + prod Stripe webhook; set Production vars in Vercel | Create staging Supabase + optional staging webhook; set Preview vars in Vercel |

See [ENVIRONMENTS.md](ENVIRONMENTS.md) for required env vars per environment and [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) for Stripe/Supabase details.
