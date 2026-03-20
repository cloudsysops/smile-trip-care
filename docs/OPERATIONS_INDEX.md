# Operations index

Quick links for running and verifying the platform. No code required.

---

## Business readiness

**→ [BUSINESS_READINESS_CHECKLIST.md](BUSINESS_READINESS_CHECKLIST.md)** — Checklist: deploy, domain, contact, WhatsApp, package slugs, first test sale, Stripe webhook, admin flow, lead response playbook.

---

## Run your first sale

**→ [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md)** — Step-by-step: create a lead, recommend a package, collect the deposit with a test card, and confirm everything updated. Anyone on the team can follow this without opening the codebase.

---

## Deploy and environments

- **Vercel production** — [VERCEL_PRODUCTION_VERIFICATION_GUIDE.md](VERCEL_PRODUCTION_VERIFICATION_GUIDE.md): confirm the app is deployed and `main` is live.
- **Environments and env vars** — [ENVIRONMENTS.md](ENVIRONMENTS.md): local, dev, and production; what each environment needs (Supabase, Stripe, etc.).

---

## Package slugs (landing and packages)

- **Production package slugs** — [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md): the three main package slugs and how to fix or seed them in Supabase if needed.

---

## Day‑to‑day admin

1. Log in as admin at **/admin/login** (or /signin).
2. Open **Leads**.
3. Use the **Next action** column: **Ready to recommend package** → open the lead, set a recommendation, then **Collect deposit** when the lead is ready to pay.
4. For full flow details, use [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md).

---

## Deployment strategy

- [DEPLOYMENT_STRATEGY.md](DEPLOYMENT_STRATEGY.md) — How we use Vercel, Supabase, and Stripe; which branch deploys to production; preview deployments.
