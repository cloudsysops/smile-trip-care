# PRODUCTION LAUNCH CHECKLIST — Smile Transformation

Operational checklist to launch safely on Vercel + Supabase + Stripe.

---

## 0) Environment variables (complete list)

### Required (production)

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser anon key (RLS-protected) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe.js publishable key |
| `SUPABASE_URL` | Server | Server Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Server writes/admin ops |
| `STRIPE_SECRET_KEY` | Server secret | Stripe server API calls |
| `STRIPE_WEBHOOK_SECRET` | Server secret | Stripe webhook signature verification |

### Optional

| Variable | Scope | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Server secret | AI endpoints (`/api/ai/*`) |
| `OPENAI_MODEL` | Server | AI model override |
| `COMMIT_SHA` | Server | Version fallback for `/api/health` |
| `RATE_LIMIT_PROVIDER` | Server | `memory` or `upstash` |
| `UPSTASH_REDIS_REST_URL` | Server secret | Multi-instance rate limit backend |
| `UPSTASH_REDIS_REST_TOKEN` | Server secret | Upstash REST auth token |

> Security rule: only `NEXT_PUBLIC_*` variables can be public. Never place secrets in `NEXT_PUBLIC_*`.

---

## A) Supabase setup

1. Apply migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_assets_extended_unified.sql`
   - `supabase/migrations/0003_m9_ai_admin_connected.sql`
2. Validate RLS is enabled for:
   - `profiles`, `packages`, `leads`, `payments`, `assets`, `itineraries`, `lead_ai`
3. Validate policy behavior:
   - Public can read only published packages and approved+published assets.
   - Admin-only access for leads, payments, itineraries, lead_ai.
4. Create Storage bucket:
   - Bucket name: `assets`
   - Public bucket recommended for rendered media URLs.
5. Validate storage permissions for admin upload flow (`/api/admin/assets/upload`).

**TODO (manual step):** storage bucket creation/policies are not codified in migrations yet; configure and verify in Supabase Dashboard before launch.

---

## B) Stripe setup

1. Add production keys in Vercel:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
2. Configure webhook endpoint:
   - `https://<your-domain>/api/stripe/webhook`
3. Subscribe webhook events:
   - `checkout.session.completed` (required)
   - `checkout.session.expired` (recommended for operations visibility)
   - `payment_intent.payment_failed` (recommended for troubleshooting)
4. Confirm webhook signature verification uses raw body (`request.text()`) and signing secret.
5. Confirm idempotency behavior:
   - replayed `checkout.session.completed` events should not duplicate state transitions.

---

## C) Vercel setup

1. Connect GitHub repository to Vercel project.
2. Configure environments:
   - Production: branch `main`
   - Preview: PR/branch deployments
3. Configure all required env vars for Production and Preview (where applicable).
4. Configure custom domain and verify TLS certificate.
5. Redirects/canonical settings:
   - Ensure primary domain is canonical and redirect alternatives (www/non-www) consistently.
6. Run post-deploy checks:
   - `GET /api/health`
   - `GET /api/health/ready`

---

## D) First admin user creation and role assignment

1. Create first user via Supabase Auth (email/password or magic link).
2. Promote to admin in SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@your-domain.com';
```

3. Validate:
   - Admin can access `/admin/leads`
   - Non-admin user is blocked from admin routes and `/api/admin/*`.

---

## E) Production smoke tests (URLs + expected result)

1. `GET /api/health`  
   Expect: `200` and payload:
   ```json
   { "status": "ok", "version": "...", "time": "...", "request_id": "..." }
   ```
2. `GET /api/health/ready`  
   Expect: `200` with `ready: true`.
3. `GET /`  
   Expect: landing loads without server errors.
4. `GET /assessment` and submit valid form  
   Expect: redirect to `/thank-you?lead_id=...`.
5. `GET /admin/login` then login as admin  
   Expect: access to `/admin/leads`.
6. `POST /api/stripe/checkout` as admin flow  
   Expect: returns checkout URL.
7. Complete Stripe test payment + webhook delivery  
   Expect: `payments.status = succeeded`, `leads.status = deposit_paid`.

---

## Logging and observability baseline

- Every API route should include `request_id` in responses/log lines where possible.
- Use `request_id` to correlate:
  - Vercel function logs
  - API error payloads
  - Stripe webhook processing traces

### Optional Sentry hooks (non-blocking)

Sentry is optional and not required for launch. If enabled later:

1. Add `SENTRY_DSN` in Vercel (server-only).
2. Initialize Sentry in Next.js server/runtime entrypoints.
3. Capture route-level exceptions with `request_id` in tags or extra metadata.

**TODO (optional):** add Sentry SDK wiring only when alerting/on-call policy is finalized.

---

## Final go/no-go gate

- CI (`npm ci`, `npm run lint`, `npm run build`) is green.
- Required env vars pass `./scripts/env_check.sh`.
- Health endpoints and payment webhook flow validated in Production.
