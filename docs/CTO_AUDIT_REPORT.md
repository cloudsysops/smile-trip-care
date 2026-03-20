# CTO Audit Report — Nebula Smile MVP

## Run & test steps (by module)

### M1 Foundation & CI
- **Run:** `npm ci && npm run lint && npm run build`
- **Test:** Build passes; no secrets in repo; `.env.local.example` documents vars; `./scripts/verify_all.sh` runs lint + build.

### M2 Database & RLS
- **Run:** Apply `supabase/migrations/0001_init.sql` in Supabase SQL editor (or `supabase db push`). Then run `scripts/seed_packages.sql`.
- **Test:** In Supabase Table Editor: `packages` has 2 rows (smile-medellin, smile-manizales) with `published=true`. RLS: anon can SELECT only published packages; service role can do all.

### M3 Landing
- **Run:** `npm run dev` → open http://localhost:3000
- **Test:** Homepage shows Medellín + Manizales, trust anchor (Clínica San Martín), disclaimer, CTA "Go to assessment". If Supabase + seed are set, "View package" links appear.

### M4 Packages
- **Run:** Visit http://localhost:3000/packages/smile-medellin (and smile-manizales after seed).
- **Test:** Page shows name, location, description, duration, deposit, included, itinerary outline, CTA to assessment. 404 for unknown slug.

### M5 Assessment UI + M5.1 /api/leads
- **Run:** Visit http://localhost:3000/assessment. Fill form (first/last name, email required). Submit.
- **Test:** Redirect to `/thank-you?lead_id=<uuid>`. Lead appears in DB with `status='new'`. Honeypot: send `company_website: "http://spam"` in POST body → 200 OK, no row inserted. Rate limit: >10 requests from same IP in 1 min → 429.
- **Curl (valid):**
  ```bash
  curl -X POST http://localhost:3000/api/leads \
    -H "Content-Type: application/json" \
    -d '{"first_name":"Jane","last_name":"Doe","email":"jane@example.com","phone":"","country":"","package_slug":"","message":""}'
  ```
  Expect `{ "lead_id": "<uuid>", "request_id": "..." }`.
- **Curl (honeypot):**
  ```bash
  curl -X POST http://localhost:3000/api/leads \
    -H "Content-Type: application/json" \
    -d '{"first_name":"J","last_name":"D","email":"b@b.com","company_website":"http://bot"}'
  ```
  Expect `{ "ok": true, "request_id": "..." }` and no new row in `leads`.

### M6 Admin leads
- **Run:** Visit http://localhost:3000/admin/leads → redirect to http://localhost:3000/admin/login. Sign in with Supabase Auth (email/password). Create admin user: in Supabase Auth create user, then in SQL set `profiles.role = 'admin'` for that user id.
- **Test:** After login, /admin/leads lists leads; click lead → /admin/leads/[id]. Update status via form; PATCH /api/admin/leads/[id] with `{ "status": "contacted" }` (with session cookie) → 200. Without session or non-admin → 403. Sign out → redirect to login.

### M7 Stripe deposit + webhook
- **Run:** From admin lead detail, click "Collect deposit ($500)". Completes Stripe Checkout (test card 4242…). Webhook must receive `checkout.session.completed`.
- **Test (local webhook):**
  1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
  2. Login: `stripe login`
  3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  4. Copy webhook signing secret (whsec_…) into `.env.local` as `STRIPE_WEBHOOK_SECRET`
  5. Restart dev server. Trigger checkout from admin; complete payment. CLI shows event; app updates `payments.status` to `succeeded` and `leads.status` to `deposit_paid`.
- **Audit:** Webhook route uses `request.text()` for raw body and `Stripe.webhooks.constructEvent(payload, signature, secret)`; no parsed JSON for verification.

---

## Final local testing checklist

| Step | URL / Command | Expected |
|------|----------------|----------|
| 1 | http://localhost:3000 | Landing: locations, CTA assessment |
| 2 | http://localhost:3000/packages/smile-medellin | Package page (after seed) |
| 3 | http://localhost:3000/assessment | Form; submit → thank-you with lead_id |
| 4 | `curl -X POST .../api/leads` (body above) | 200 + lead_id |
| 5 | http://localhost:3000/admin/login | Login form; sign in (admin user) |
| 6 | http://localhost:3000/admin/leads | List of leads |
| 7 | http://localhost:3000/admin/leads/[id] | Detail + status form + Collect deposit |
| 8 | Click Collect deposit | Redirect to Stripe Checkout; pay with 4242… |
| 9 | After payment + webhook | Lead status deposit_paid; payment succeeded |
| 10 | `npm run lint && npm run build` | Pass |

---

## Security checklist
- [x] Server-side writes use `SUPABASE_SERVICE_ROLE_KEY` only in server code.
- [x] Env split: server vs public configs.
- [x] Stripe webhook verifies signature with raw body.
- [x] Admin protected by middleware (session) + server role check (`profiles.role = 'admin'`).
- [x] Security headers in next.config.
- [x] No medical promises; disclaimers on landing.
