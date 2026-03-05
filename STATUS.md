# Smile Transformation — Module Status

| Module | Status | Notes |
|--------|--------|-------|
| **M1** Foundation & CI | ✅ Done | Next.js 16, TS, Zod, logger, server config, security headers, GitHub Actions (lint + build) |
| **M2** Database & RLS | ✅ Done | `0001_init.sql`: profiles, packages, leads, payments, assets, itineraries, lead_ai; RLS + `is_admin()` |
| **M3** Landing | ✅ Done | Hero, trust (Clínica San Martín), packages from DB |
| **M4** Packages + seed | ✅ Done | `scripts/seed_packages.sql` (smile-medellin, smile-manizales); run after migration |
| **M5** Assessment UI | ✅ Done | Form with honeypot, package prefill from query; POST to `/api/leads` |
| **M5.1** `/api/leads` | ✅ Done | Server-side POST, Zod, service role only; honeypot rejection |
| **M6** Admin leads | ⏳ Pending | Auth + role gate, leads list |
| **M7** Stripe checkout + webhook | ⏳ Pending | Checkout session, webhook with raw body verification |
| **M8** Admin assets manager | ✅ Done | Upload/edit/delete with Supabase Storage, filters and moderation toggles |
| **M9** AI agents (admin connected) | ✅ Done | `/api/ai/{triage,respond,itinerary}`, Zod-validated strict JSON, persisted + visible in `/admin/leads/[id]` |

## Run after migration
```bash
# In Supabase SQL editor, run:
# 1. supabase/migrations/0001_init.sql
# 2. scripts/seed_packages.sql
```

## Env
Copy `.env.example` to `.env.local` and set Supabase (and Stripe when M7 is added).
