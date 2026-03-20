# Nebula Smile — Project Master Context

## Goal
Premium, trustworthy, scalable **health + tourism coordination** platform.

## Locations
- **Medellín** — Nebula Smile + optional Guatapé tour
- **Manizales** — Recovery + finca foundation HQ + coffee region experience

## Trust anchor
**Clínica San Martín** — Family-run specialists + family lodging + internal transport.

## Legal
- USA LLC sells international coordination & hospitality services.
- Medical services billed by clinics in Colombia.
- **No medical promises.**

## Tech stack
- **Next.js** App Router + TypeScript
- **Supabase** — Postgres / Auth / Storage
- **Stripe** — Checkout + Webhooks
- **Vercel** deploy
- **GitHub Actions** CI
- **Zod** validation
- Structured logger
- Security headers
- **RLS** strict
- **Server-side API** for ALL writes using `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## Rules
- Scan repo first; reuse code; avoid duplication.
- API routes **thin**; business logic in `/lib`.
- Validate inputs (Zod).
- Stripe webhook verifies signature using **RAW body**.
- Public reads only `published=true` content; assets require `approved+published`.
- After each module: `npm run lint && npm run build`; fix errors.

## Modules
| Module | Description |
|--------|-------------|
| **M1** | Foundation & CI |
| **M2** | Database & RLS (minimal MVP) |
| **M3** | Landing |
| **M4** | Packages + seed |
| **M5** | Assessment UI |
| **M5.1** | `/api/leads` (server-side) |
| **M6** | Admin leads (auth + role gate) |
| **M7** | Stripe checkout + webhook |
