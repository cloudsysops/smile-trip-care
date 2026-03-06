# Smile Transformation — Module Status

## Startup Sprint Tracker

| Track | Status | Definition of done |
|-------|--------|--------------------|
| **M8** Assets Manager + hardening | ✅ Done | CI green (`lint` + `build`), health endpoints, unified migration, admin assets fixes |
| **M9** AI Workers (triage/reply/itinerary) | ✅ Done | Endpoints + admin UI connected, outputs persisted and visible in lead detail |
| **Deploy** (Vercel + Stripe + Supabase) | ⏳ Pending | Prod env configured, webhook verified, smoke tests in production |

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

## Run after migration
```bash
# In Supabase SQL editor, run:
# 1. supabase/migrations/0001_init.sql
# 2. supabase/migrations/0002_assets_extended_unified.sql
# 3. supabase/migrations/0003_m9_ai_admin_connected.sql
# 4. supabase/migrations/0004_leads_attribution.sql
# 5. scripts/seed_packages.sql
```

## Env
Copy `.env.example` to `.env.local` and set Supabase (and Stripe when M7 is added).
