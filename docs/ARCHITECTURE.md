# Arquitectura — MedVoyage Smile

Visión de alto nivel del sistema. Este repo es el **producto canónico** (ver [PRODUCT_PLATFORM_STRATEGY.md](PRODUCT_PLATFORM_STRATEGY.md)).

---

## Flujo principal

```
Traffic / discovery
       ↓
Assessment (form → POST /api/leads)
       ↓
Supabase Leads
       ↓
AI Copilot (summary, priority, drafts)
       ↓
Follow-ups (24h, 3d, 7d drafts)
       ↓
Coordinator (admin CRM, outbound queue)
       ↓
Stripe deposit (checkout + webhook)
       ↓
Analytics (/admin/analytics)
```

---

## Capas

| Capa | Tecnología | Rol |
|------|------------|-----|
| **App** | Next.js 16 (App Router), React 19, TypeScript | Landing, assessment, thank-you, dashboards (admin, patient, provider, specialist, coordinator). |
| **API** | Route Handlers (Next.js) | Leads, Stripe checkout, Stripe webhook, health, admin AI (copilot, triage, respond, itinerary), follow-up, outbound. |
| **Data** | Supabase (Postgres, Auth, Storage) | leads, payments, bookings, packages, profiles, lead_ai, outbound_messages, automation queue. RLS y service role desde servidor. |
| **Payments** | Stripe | Checkout session; webhook `checkout.session.completed` → actualiza lead/payment/booking. |
| **AI** | OpenAI (opcional) | Lead copilot, follow-up drafts, Reddit responder, triage, sales responder, itinerary. |
| **Deploy** | Vercel | Build desde Git; env en Vercel; un proyecto por ambiente (dev/staging/prod según configuración). |

---

## Crecimiento y analytics

- **Traffic discovery:** Reddit (script `npm run growth:leads`), resultados en `data/reddit-leads.json`. Ver [GROWTH_LEAD_DISCOVERY.md](GROWTH_LEAD_DISCOVERY.md).
- **Analytics:** `/admin/analytics` — métricas desde Supabase (leads, high priority, packages, país). Ver [ANALYTICS_DASHBOARD.md](ANALYTICS_DASHBOARD.md).
- **Futuro (opcional):** Tabla `events` (assessment_started, assessment_completed, proposal_viewed, whatsapp_clicked, deposit_paid) para métricas de conversión más finas. Ver también [SINTESIS_Y_PLAN_MEJORAS.md](SINTESIS_Y_PLAN_MEJORAS.md).

---

## Calidad y seguridad

- **Verify:** `npm run verify` → lint, test, env_check, build.
- **CI:** GitHub Actions (lint, test, env shape, build). Opcional: workflow de security (secret scan, npm audit). Ver [GITHUB_GOVERNANCE_FINAL.md](GITHUB_GOVERNANCE_FINAL.md).
- **Secrets:** Solo en env (Vercel, `.env.local` no commiteado). Ver [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md), [SECURITY.md](../SECURITY.md).

---

## Documentos relacionados

- [STATUS.md](../STATUS.md) — Módulos y estado del proyecto.
- [DATA_MODEL.md](DATA_MODEL.md) — Tablas y relaciones.
- [STRIPE_WEBHOOKS_ENVIRONMENTS.md](STRIPE_WEBHOOKS_ENVIRONMENTS.md) — Webhooks por ambiente.
- [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md) — Checklist go-live.
