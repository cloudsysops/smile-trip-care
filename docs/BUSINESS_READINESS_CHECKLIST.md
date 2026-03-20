# Business readiness checklist — MedVoyage Smile

Use this checklist to confirm the product is ready for first leads, first test sale, first real sale, and day-1 operations. Complete in order where possible.

---

## Deploy and domain

- [ ] **Production deploy healthy** — Vercel deployment from `main` is **Ready**. See [VERCEL_PRODUCTION_VERIFICATION_GUIDE.md](VERCEL_PRODUCTION_VERIFICATION_GUIDE.md).
- [ ] **Domain configured** — Custom domain (e.g. medvoyagesmile.com) added in Vercel → Settings → Domains. `NEXT_PUBLIC_SITE_URL` set in Vercel Production env (e.g. `https://medvoyagesmile.com`). Redeploy after adding.

---

## Contact and sales

- [ ] **Contact email chosen** — Decide the reply-to / support email. Optional: set `OUTBOUND_EMAIL_FROM` in Vercel for outbound emails. No code change required for “contact us” if using WhatsApp + admin flow.
- [ ] **WhatsApp contact enabled** — Set `NEXT_PUBLIC_WHATSAPP_NUMBER` in Vercel (Production) to your business number (digits only, e.g. `14014427003`). Redeploy. Test the floating button and thank-you page button.

---

## Data and packages

- [ ] **Package slugs verified** — In production Supabase, the three package rows exist and are **published**: `essential-care-journey`, `comfort-recovery-journey`, `premium-transformation-experience`. If missing, follow [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md).

---

## First sale and Stripe

- [ ] **First test sale completed** — Run the full flow once: assessment → lead → admin recommend package → collect deposit → Stripe test card (4242…) → confirm lead status `deposit_paid` in admin and Supabase. See [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md).
- [ ] **Stripe webhook** — In Stripe Dashboard: endpoint `https://<your-domain>/api/stripe/webhook`, event `checkout.session.completed`. `STRIPE_WEBHOOK_SECRET` set in Vercel Production. Redeploy after adding the secret.

---

## Operations

- [ ] **Founder can operate admin flow** — Log in at /admin/login, open Leads, use **Next action** (Ready to recommend package / Ready to collect deposit), recommend package, collect deposit. No blockers.
- [ ] **First lead response playbook ready** — Team knows: check Admin → Leads regularly (no automatic “new lead” email yet), respond within ~24 hours, recommend package when ready, then collect deposit when lead is ready.

---

## Quick reference

| Need | Doc |
|------|-----|
| Run first sale | [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) |
| Deploy / env | [OPERATIONS_INDEX.md](OPERATIONS_INDEX.md), [ENVIRONMENTS.md](ENVIRONMENTS.md) |
| Fix package 404s | [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md) |
| Vercel verification | [VERCEL_PRODUCTION_VERIFICATION_GUIDE.md](VERCEL_PRODUCTION_VERIFICATION_GUIDE.md) |
