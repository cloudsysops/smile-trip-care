# Production Checklist — Nebula Smile

Use this checklist before promoting a release to production.

## 1) Environment & secrets

- [ ] `SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (server-only)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `STRIPE_SECRET_KEY` is set
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` is set (optional but recommended)
- [ ] `OPENAI_API_KEY` set if AI endpoints are enabled
- [ ] No server-only secrets are exposed under `NEXT_PUBLIC_*`

## 2) Database & storage

- [ ] Supabase migrations applied (`0001` ... `0009`)
- [ ] `packages` seed executed (if required for environment)
- [ ] `assets` storage bucket exists
- [ ] Storage permissions reviewed for signed URL workflow

## 3) Security controls

- [ ] Admin routes require authentication at proxy/session layer
- [ ] Admin APIs enforce `requireAdmin` server-side
- [ ] All write operations use server service-role client only
- [ ] Stripe webhook verifies signature with raw body
- [ ] Stripe webhook idempotency ledger (`stripe_webhook_events`) is active
- [ ] Security headers are active in `next.config.ts`
- [ ] Rate limiting configured:
  - [ ] `RATE_LIMIT_PROVIDER=memory` (dev/single instance) or
  - [ ] `RATE_LIMIT_PROVIDER=upstash` + Upstash env vars (production multi-instance)

## 4) Functional validation

- [ ] Landing page loads with hero, packages, FAQ, testimonials, and visible CTA
- [ ] Mobile view confirms sticky assessment CTA is always visible
- [ ] Assessment submission success path works
- [ ] Honeypot submission returns success shape without inserting a lead
- [ ] Admin login works and non-admin access is rejected
- [ ] Stripe checkout session can be created from admin lead detail
- [ ] Stripe webhook updates payment and lead status on completion
- [ ] Payments reconcile endpoint (`/api/automation/payments-reconcile`) is reachable with cron secret

## 5) Quality gates

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes (recommended)

## 6) Observability & operations

- [ ] `/api/health` returns 200
- [ ] `/api/health/ready` returns 200 in production
- [ ] Logs include `request_id` for traceability
- [ ] Incident owner and rollback plan are defined

## 7) Final go/no-go

- [ ] PM/CTO sign-off on conversion messaging
- [ ] Security sign-off on admin/write/webhook posture
- [ ] Deployment window confirmed
- [ ] Post-deploy smoke checks completed
