# Smile Transformation — Cursor Rules

- **Cursor Mobile / Agents:** Las mismas reglas aplican al trabajar desde la app móvil o desde cursor.com/agents. Ver `docs/CURSOR_MOBILE.md` para conectar el repo con GitHub y abrirlo en el móvil.

## Project
- Next.js App Router + TypeScript. Supabase (Postgres/Auth/Storage), Stripe, Vercel.
- USA LLC: coordination & hospitality only. Medical services billed by clinics in Colombia. No medical promises.

## Code
- API routes: thin; business logic in `/lib`.
- Validate all inputs with Zod. Use schemas in `lib/validation/`.
- Server-side writes: use Supabase **service role** only in server code (`lib/supabase/server.ts`). Never expose `SUPABASE_SERVICE_ROLE_KEY` to client.
- Env: server secrets in `lib/config/server.ts`, public in `lib/config/public.ts`. Do not mix.
- Stripe webhook: verify signature using **raw body** (`request.text()`); use `stripe.webhooks.constructEvent`.
- Public reads: only `published=true` for packages; assets require `approved=true` AND `published=true`.
- Admin: protect `/admin/*` with middleware; enforce `profiles.role = 'admin'` server-side for pages and APIs.
- After each change: run `npm run lint && npm run build`; fix errors before continuing.

## Structure
- `lib/config/` — env (server vs public).
- `lib/validation/` — Zod schemas.
- `lib/supabase/` — server (service role) and browser (anon) clients.
- `lib/logger.ts` — structured logs; include `request_id` when available.
