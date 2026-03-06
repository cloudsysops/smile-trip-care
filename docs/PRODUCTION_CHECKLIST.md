# Production Checklist

This checklist is the minimum gate before launching Smile Transformation to production.

## 1) Environment variables

Set these in the hosting platform (Production scope):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_API_VERSION` (recommended: `2026-02-25.clover`)
- `OPENAI_API_KEY` (required if `/api/ai/*` routes are enabled in production)

## 2) Database readiness

- Apply Supabase migrations in order.
- Confirm core tables exist: `profiles`, `packages`, `leads`, `payments`, `assets`, `itineraries`, `lead_ai`.
- Confirm admin user exists and has `profiles.role = 'admin'`.

## 3) App/API readiness

- Health checks:
  - `GET /api/health` returns `{ ok: true, service, timestamp }`
  - `GET /api/health/ready` returns `200` with `ready: true`
- API error responses do not expose stack traces.
- `request_id` is present in API error payloads.

## 4) Security checks

- `/admin/*` is protected by `proxy.ts`.
- Every `/api/admin/*` route calls `requireAdmin()` server-side.
- Service-role secrets are server-only and never exposed as `NEXT_PUBLIC_*`.
- Stripe webhook verifies signature using raw request body.

## 5) Stripe checks

- Webhook endpoint configured at:
  - `https://<your-domain>/api/stripe/webhook`
- Stripe dashboard sends `checkout.session.completed`.
- Test payment updates:
  - `payments.status = succeeded`
  - `leads.status = deposit_paid`

## 6) Verification commands

Run before deploy:

```bash
npm run lint
npm run test
npm run build
```

## 7) Post-deploy smoke

```bash
curl -s https://<your-domain>/api/health
curl -s https://<your-domain>/api/health/ready
```

Then verify:

- Assessment lead submission (`/api/leads`)
- Admin login + `/admin/leads`
- Stripe checkout + webhook
