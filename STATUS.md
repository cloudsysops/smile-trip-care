# MedVoyage Smile — Module Status

## Startup Sprint Tracker

| Track | Status | Definition of done |
|-------|--------|--------------------|
| **M8** Assets Manager + hardening | ✅ Done | CI green (`lint` + `build`), health endpoints, unified migration, admin assets fixes |
| **M9** AI Workers (triage/reply/itinerary) | ✅ Done | Endpoints + admin UI connected, outputs persisted and visible in lead detail |
| **Deploy** (Vercel + Stripe + Supabase) | 🔶 Casi listo | **Un solo proyecto Vercel (dev canónico)**: `smile-transformation-platform-dev` → URL: https://smile-transformation-platform-dev.vercel.app (rama `main`). Env + webhook configurados; smoke OK. No usar `transformation-platform-dev.vercel.app` para QA (proyecto antiguo). [docs/VERCEL_UN_SOLO_PROYECTO.md](docs/VERCEL_UN_SOLO_PROYECTO.md). Checklist: [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md). |

---

| Module | Status | Notes |
|--------|--------|-------|
| **M1** Foundation & CI | ✅ Done | Next.js 16, TS, Zod, logger, server config, security headers, GitHub Actions (lint + build) |
| **M2** Database & RLS | ✅ Done | `0001_init.sql`: profiles, packages, leads, payments, assets, itineraries, lead_ai; RLS + `is_admin()` |
| **M3** Landing | ✅ Done | Hero, trust (Clínica San Martín), packages from DB |
| **M4** Packages + seed | ✅ Done | `scripts/seed_packages.sql` (smile-medellin, smile-manizales); run after migration |
| **M5** Assessment UI | ✅ Done | Form with honeypot, package prefill from query; POST to `/api/leads` |
| **M5.1** `/api/leads` | ✅ Done | Server-side POST, Zod, service role only; honeypot rejection |
| **M6** Admin leads | ✅ Done | Auth + role gate, leads list/detail, status updates |
| **M7** Stripe checkout + webhook | ✅ Done | Checkout session, webhook with raw body verification |
| **M8** Admin assets manager | ✅ Done | Upload/edit/delete with Supabase Storage, filters and moderation toggles |
| **M8.1** CTO hardening | ✅ Done | `/api/health`, readiness checks, migration `0002` unificada, manejo de errores mejorado |
| **M9** AI agents (admin connected) | ✅ Done | `/api/ai/{triage,respond,itinerary}`, Zod-validated strict JSON, persisted + visible in `/admin/leads/[id]` |
| **M9.1** AI lead responder (selling mode) | ✅ Done | “Generate Reply” returns WhatsApp + email drafts, copy-ready UI, persisted in `lead_ai.messages_json` |
| **M10** Conversion attribution | ✅ Done | Package CTA keeps intent (`?package=`), lead capture stores UTM/referrer/landing path, admin lead detail shows attribution |
| **M11** Sales follow-up queue | ✅ Done | Leads include next follow-up/last contacted/notes, admin queue prioritizes overdue leads, detail page includes follow-up planner |
| **M12** Deposit pricing governance | ✅ Done | Stripe checkout amount is resolved server-side from package pricing, client amount ignored, admin deposit CTA reflects effective amount |
| **M13** Agent automation foundation | ✅ Done | Internal server-side triggers run triage/respond after lead creation, itinerary/ops after deposit_paid, plus cron-safe 24h/48h follow-up drafts |
| **M14** Durable automation queue | ✅ Done | Trigger events enqueue jobs in `ai_automation_jobs`; worker endpoint executes jobs with locks, retries, and dead-letter handling |
| **M16** Assisted outbound conversion engine | ✅ Done | Admin queue for outbound drafts (AI/manual), approval/send/reply tracking, and lead contact logging via `outbound_messages` |
| **M17** Outbound command center | ✅ Done | Admin outbound dashboard with actionable queue and SLA-risk metrics to prioritize follow-up actions |
| **M18** Outbound dispatch worker | ✅ Done | Secret-protected outbound worker sends queued messages via providers, retries with backoff, and marks permanent failures |
| **M19** Launch reliability guardrails | ✅ Done | Stripe paid-state validation, payments idempotency constraints, stale AI lock recovery, and automation status visibility |
| **Marketplace foundation** | ✅ Done | 0007: providers, packages type/price/provider_id, experiences provider_id. 0008: specialists.provider_id, leads.package_id, bookings. Lead API crea booking; webhook actualiza booking. |
| **Curated network** | ✅ Done | 0009: providers (invited_by, approved_by, approval_status), specialists (recommended_by, approval_status). [DATA_MODEL](docs/DATA_MODEL.md), [CURATED_NETWORK_FOUNDATION](docs/CURATED_NETWORK_FOUNDATION.md). |
| **Curated network enterprise (0010)** | ✅ Done | Migration 0010: providers, packages, specialists, experiences, package_experiences, package_specialists, consultations, bookings. RLS published+approved. [CURATED_NETWORK_WORKFLOW](docs/CURATED_NETWORK_WORKFLOW.md). |
| **Admin Overview** | ✅ Done | `/admin` → `/admin/overview`. KPIs, navegación Leads/Assets. [DASHBOARDS_POR_ROL](docs/DASHBOARDS_POR_ROL.md). |
| **Auth + role dashboards (0011)** | ✅ Done | Migration 0011: profiles (role, provider_id, specialist_id). Login `/login`, dashboards `/provider`, `/specialist`, `/coordinator`, `/patient`. [AUTH_AND_ROLES](docs/AUTH_AND_ROLES.md), [DASHBOARD_ROLES](docs/DASHBOARD_ROLES.md). |
| **Auditoría buenas prácticas** | ✅ Hecho (2026-03) | [AUDITORIA_RESULTADO](docs/AUDITORIA_RESULTADO.md). [TAREAS_AUDITORIA](docs/TAREAS_AUDITORIA_BUENAS_PRACTICAS.md). |
| **Production readiness + role dashboards + sales flow** | ✅ Done | Auth + roles (profiles); /login, optional /signup (patient); role redirects; role guards; dashboards /patient, /provider, /specialist, /coordinator, /admin; lead **recommended package** (thank-you, admin override, patient dashboard); patient **Pay deposit** (Stripe checkout for own lead); migration 0020. [AUTH_AND_ROLES](docs/AUTH_AND_ROLES.md), [DASHBOARD_ROLES](docs/DASHBOARD_ROLES.md), [TEST_FIRST_SALE](docs/TEST_FIRST_SALE.md). |

## Run after migration
Aplicar migraciones en orden lexicográfico **0001 → 0018**. Desde repo (con Supabase enlazado): `npm run db:migrate`. Lista completa: [supabase/migrations/MIGRATION_ORDER.md](supabase/migrations/MIGRATION_ORDER.md). Luego opcional: `scripts/seed_packages.sql`, `scripts/seed_marketplace_foundation.sql`.

## Rutas principales
- **Público:** `/`, `/assessment`, `/packages`, `/health-packages`, `/tour-experiences`, `/packages/[slug]`, `/thank-you`, `/legal`, `/login`, `/signin`.
- **Admin:** `/admin` (redirect a overview), `/admin/overview`, `/admin/leads`, `/admin/leads/[id]`, `/admin/providers`, `/admin/specialists`, `/admin/experiences`, `/admin/bookings`, `/admin/consultations`, `/admin/assets`, `/admin/login`, `/admin/status`.
- **Por rol:** `/provider`, `/specialist`, `/coordinator`, `/patient` (requieren login y rol correspondiente).

## Env
Copy `.env.example` to `.env.local` and set Supabase (and Stripe when M7 is added). Ver [docs/ENV_Y_STRIPE.md](docs/ENV_Y_STRIPE.md).

### Hosts canónicos

- Local: `http://localhost:3000`
- Dev (Vercel): `https://smile-transformation-platform-dev.vercel.app` (`smile-transformation-platform-dev`, rama `main`)
- Prod: dominio final (ej. `https://medvoyagesmile.com`) conectado a Vercel cuando se haga el lanzamiento

No usar `https://transformation-platform-dev.vercel.app` para pruebas: es un proyecto antiguo / no alineado con este repo.
