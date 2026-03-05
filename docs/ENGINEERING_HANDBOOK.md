# Engineering Handbook

## Stack
- **Next.js** App Router, TypeScript, Tailwind.
- **Supabase**: Postgres, Auth, Storage. RLS enabled. Writes via service role only on server.
- **Stripe**: Checkout + webhooks. Webhook signature verified with raw body.
- **Vercel**: Deploy. **GitHub Actions**: CI (lint + build).

## Env
- **Server** (`lib/config/server.ts`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`. Never expose to client.
- **Public** (`lib/config/public.ts`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Copy `.env.local.example` to `.env.local` and fill for local dev.

## Conventions
- API routes: thin; delegate to `lib/`.
- Validate inputs with Zod. Honeypot + rate limit on lead submission.
- Logging: structured JSON; include `request_id` when available.
- Admin: middleware protects `/admin/*`; server-side check `profiles.role = 'admin'`.

## Verify
```bash
./scripts/verify_all.sh
# or: npm run lint && npm run build
```
