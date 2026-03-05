# Security & Compliance

## Secrets
- **Server-only**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Used only in server code (API routes, server components, server actions). Never in client bundles or `NEXT_PUBLIC_*`.
- **Server-only AI secret**: `OPENAI_API_KEY`. Never expose in client code or `NEXT_PUBLIC_*`.
- **Public**: Only `NEXT_PUBLIC_*` vars. No secrets there.

## Supabase
- RLS enabled on all tables. Service role bypasses RLS; use only on server for writes. Client uses anon key; RLS enforces packages (published), assets (approved+published), leads/payments/admin-only.

## Stripe
- Webhook: verify signature with `stripe.webhooks.constructEvent(payload, signature, webhookSecret)`. Payload must be raw body (`request.text()`), not parsed JSON.

## Admin
- `/admin/*` protected by middleware (session required). All admin pages and `/api/admin/*` must verify `profiles.role = 'admin'` server-side.
- AI generation routes (`/api/ai/*`) must call `requireAdmin()` and run only on server.

## AI policy (M9)
- No medical advice, diagnosis, or treatment guarantees in generated content.
- Agent outputs must be strict JSON and validated with Zod before saving.
- Keep human-in-the-loop: generate drafts for review; do not auto-send outbound messages yet.
- Avoid logging raw lead notes in error logs if they can contain sensitive personal details.

## Headers
- Security headers set in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
