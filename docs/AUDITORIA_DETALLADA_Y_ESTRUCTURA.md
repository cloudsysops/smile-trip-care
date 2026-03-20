# Auditoría detallada, estructura del proyecto y recomendaciones

**Proyecto:** MedVoyage Smile (Smile Transformation Platform)  
**Fecha:** 2026-03  
**Objetivo:** Estructura actual, auditoría por capas, qué implementaría, qué mejoraría y qué está pendiente.

---

# 1. Estructura del proyecto

## 1.1 Vista general

```
smile-transformation-platform/
├── app/                    # Next.js 16 App Router (páginas + API)
├── lib/                    # Lógica compartida, auth, Supabase, validación, AI
├── supabase/migrations/    # 20 migraciones SQL (0001 → 0020)
├── scripts/                # Migraciones, verify, smoke, deploy, seeds
├── tests/                  # Vitest (unit/integration)
├── e2e/                    # Playwright (assessment, proposal, mobile)
├── docs/                   # 80+ documentos (auditorías, planes, runbooks)
├── agents/                 # Prompts y especificaciones para agentes IA
├── .cursor/                # Reglas, prompts, agentes Cursor
├── .github/                # CI (lint, test, build), security, ISSUE_TEMPLATE
├── public/                 # Assets estáticos
├── infrastructure/         # Entornos (si aplica)
├── STATUS.md               # Estado de módulos y deploy
├── AGENTS.md               # Instrucciones para agentes
├── README.md               # Setup, scripts, cómo vender
└── package.json
```

## 1.2 Capa de aplicación (`app/`)

| Ruta / carpeta | Contenido |
|----------------|-----------|
| **Páginas públicas** | `page.tsx` (landing), `assessment/`, `packages/`, `packages/[slug]/`, `thank-you/`, `legal/`, `login/`, `signin/`, `signup/`, `health-packages/`, `tour-experiences/`, `specialists/[slug]/`, `dental-implants-colombia/`, `veneers-colombia/`, `hollywood-smile-colombia/` |
| **Assessment** | `assessment/page.tsx`, `AssessmentWizard.tsx`, `AssessmentForm.tsx`, `assessment/proposal/page.tsx` |
| **Admin** | `admin/page.tsx` (redirect), `admin/overview/`, `admin/leads/`, `admin/leads/[id]/`, `admin/providers/`, `admin/specialists/`, `admin/experiences/`, `admin/bookings/`, `admin/consultations/`, `admin/assets/`, `admin/outbound/`, `admin/status/`, `admin/analytics/`, `admin/harvester/`, `admin/login/` |
| **Dashboards por rol** | `patient/`, `provider/`, `specialist/`, `coordinator/` |
| **Componentes** | `components/landing/`, `components/dashboard/`, `components/specialist-profile/`, `components/marketplace/`, `components/booking/`, `components/ui/`, `WhatsAppButton.tsx`, `ThemeProvider.tsx` |
| **API** | `api/health/`, `api/health/ready/`, `api/leads/`, `api/signup/`, `api/auth/me/`, `api/auth/signout/`, `api/stripe/checkout/`, `api/stripe/webhook/`, `api/ai/`, `api/admin/*`, `api/automation/`, `api/clinical/`, `api/auth/callback/` |

## 1.3 Capa de lógica y datos (`lib/`)

| Módulo | Responsabilidad |
|--------|------------------|
| **Auth** | `auth.ts` (requireAdmin, requirePatient, etc.), `supabase/server.ts`, `supabase/browser.ts`, `supabase/middleware.ts` |
| **Config** | `config/server.ts`, `config/public.ts` |
| **Validación** | `validation/lead.ts`, `validation/package.ts`, `validation/asset.ts`, etc. (Zod) |
| **Dominio** | `packages.ts`, `leads.ts`, `providers.ts`, `specialists.ts`, `experiences.ts`, `consultations.ts`, `bookings.ts`, `assets.ts` |
| **Pagos** | `payments/reliability.ts` (idempotencia, estado) |
| **AI** | `ai/openai.ts`, `ai/prompts.ts`, `ai/schemas.ts`, `ai/automation.ts`, `ai/lead-copilot.ts`, `ai/persist.ts`, `ai/run-agent.ts` |
| **Automatización** | `automation/queue.ts` (cola, locks, reintentos) |
| **Outbound** | `outbound/dispatcher.ts`, `outbound/messages.ts`, `outbound/providers.ts` |
| **Rate limit** | `rate-limit.ts`, `rate-limit/provider.ts` |
| **Otros** | `branding.ts`, `logger.ts`, `dashboard-data.ts`, `followup/lead-followup.ts`, `clinical/`, `services/`, `growth/` |

## 1.4 Infraestructura y datos

| Elemento | Detalle |
|----------|---------|
| **Migraciones** | 20 archivos en `supabase/migrations/` (0001_init → 0020_leads_recommended_package). Orden en `MIGRATION_ORDER.md`. |
| **Seeds** | `seed_packages.sql`, `seed_marketplace_foundation.sql`, `seed_medical_tourism.sql`, `seed_curated_network.sql` |
| **CI** | `.github/workflows/ci.yml` (lint, test, env_check, build). Opcional: `security.yml`. |
| **Scripts** | `verify_all.sh`, `run_migrations.sh`, `check-supabase-schema.sh`, `deploy_verify.sh`, `smoke_test.sh`, `doctor-release.sh`, `smoke-deploy.sh` |

## 1.5 Documentación (`docs/`)

- **Estado y planes:** STATUS.md, NEXT_TASKS.md, PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md, AUDIT_AND_IMPROVEMENT_PLAN.md  
- **Deploy y ops:** DEPLOY_CHECKLIST.md, TEST_FIRST_SALE.md, ENV_Y_STRIPE.md, VERCEL_*, PRODUCTION_PACKAGE_SLUGS_FIX.md  
- **Modelo y roles:** DATA_MODEL.md, AUTH_AND_ROLES.md, DASHBOARDS_POR_ROL.md, CURATED_NETWORK_*  
- **Auditorías CTO:** CTO_AUDITOR_REVIEW.md, CTO_FULL_CURRENT_STATE_AUDIT.md, AUDITORIA_RESULTADO.md  
- **Sprints y diagnósticos:** SPRINT_DEV_ASSESSMENT_SUBMIT_*, DIAGNOSIS_ASSESSMENT_SUBMIT_DEV.md, REBRAND_AUDIT_MEDVOYAGE.md  

---

# 2. Auditoría detallada por capa

## 2.1 Backend (APIs, validación, seguridad)

| Aspecto | Estado | Notas |
|---------|--------|--------|
| **Rutas públicas** | ✅ Controlado | Solo POST /api/leads, GET /api/health, /api/health/ready, /api/status sin auth. Resto con auth o firma Stripe. |
| **Validación** | ✅ Sólida | Zod en leads, checkout, webhook, admin payloads. Honeypot en leads. |
| **Rate limit** | 🔶 Parcial | Solo en /api/leads. Falta en signup y login (riesgo abuso). |
| **Webhook Stripe** | ✅ Firma + idempotencia | No persiste eventos en `stripe_webhook_events` (auditoría incompleta). |
| **Guards por rol** | ✅ Consistente | requireAdmin, requirePatient, etc. en APIs y páginas. |
| **Middleware** | 🔶 Parcial | Solo protege /admin*. Rutas /provider, /specialist, /coordinator, /patient protegidas solo a nivel página. |
| **RLS** | ✅ Activo | Tablas críticas con políticas; servicio usa service role con scope en app. |
| **Tests** | ✅ 69 tests | Leads, Stripe, health, auth, automation, outbound. No hay E2E obligatorio en CI. |

## 2.2 Frontend (UX, marca, accesibilidad)

| Aspecto | Estado | Notas |
|---------|--------|--------|
| **Landing y conversión** | ✅ Listo | Hero, trust, paquetes, CTAs, thank-you, proposal. Copy orientado a conversión. |
| **Assessment** | ✅ Wizard + form | Prefill por `?package=`, UTM y atribución en submit. |
| **Admin** | ✅ Completo | Leads, providers, specialists, experiences, bookings, consultations, assets, outbound, status, analytics, harvester, copilot, follow-up. |
| **Dashboards por rol** | ✅ Implementados | Patient, provider, specialist, coordinator con datos scoped. |
| **Branding** | 🔶 En transición | `lib/branding.ts` = MedVoyage Smile; varios archivos con "Nebula Smile" hardcodeado (REBRAND_AUDIT_MEDVOYAGE). |
| **Meta / SEO** | ✅ Documentado | Layout y páginas con metadata; tareas F4 en auditoría para verificar. |
| **Accesibilidad** | 🔶 Parcial | Sprint “Salir a vender” tocó contraste y focus; F1–F4 (accesibilidad, errores, loading, SEO) pendientes de cerrar. |
| **Forgot password** | ❌ No | Backlog (Sprint 5). |

## 2.3 DevOps y despliegue

| Aspecto | Estado | Notas |
|---------|--------|--------|
| **CI** | ✅ | Lint, test, env_check, build en push/PR (main, staging, dev, feature/*, hotfix/*). |
| **Deploy** | 🔶 Casi listo | Un proyecto Vercel (smile-transformation-platform-dev), rama main. Falta Deploy ✅ en STATUS (verificación humana webhook + primera venta E2E). |
| **Migraciones** | ✅ Documentado | run_migrations.sh (supabase db push o psql con DATABASE_URL). check-supabase-schema.sh para alinear local/remoto. |
| **Sentry** | ❌ No | Planificado Sprint 4; errores en prod no centralizados. |
| **Staging** | ❌ No | Opcional (Sprint 5). Un solo entorno dev/prod aceptable para soft launch. |
| **Dominio custom** | ❌ No | Pendiente cuando se defina URL final. |

## 2.4 Integración (Stripe, Supabase, AI)

| Aspecto | Estado | Notas |
|---------|--------|--------|
| **Supabase** | ✅ | Auth, Postgres, RLS, Storage. Migraciones 0001–0020. |
| **Stripe** | ✅ | Checkout (amount desde paquete), webhook con firma e idempotencia. No escribe en stripe_webhook_events. |
| **OpenAI** | ✅ Opcional | Triage, respond, itinerary, ops, lead-copilot. Automation queue + worker. |
| **Outbound** | ✅ | Cola, aprobación, envío, tracking. Worker con reintentos. |
| **Attribution** | ✅ | UTM, referrer, landing_path en leads; visible en admin. |

## 2.5 Marketing y branding

| Aspecto | Estado | Notas |
|---------|--------|--------|
| **UTM y atribución** | ✅ | Capturado y mostrado en detalle de lead. |
| **Analytics** | ❌ No | Sin PostHog, GA ni Vercel Analytics en producción. |
| **Rebrand MedVoyage** | 🔶 En curso | Fuente única en lib/branding.ts; falta sustituir hardcoded "Nebula Smile" en UI y docs. |
| **Documentación UTM** | 🔶 Pendiente | Guía “cómo usamos UTM” para campañas no formalizada. |

---

# 3. Qué implementaría (recomendaciones prioritarias)

Sin tocar Stripe core, webhook lógica, auth core ni contratos de API:

1. **Rate limit en signup (y opcionalmente login)**  
   Misma idea que en /api/leads: por IP, ventana 15 min, máx 5 intentos, 429 si se excede. Archivos: `app/api/signup/route.ts`, `lib/rate-limit.ts`, tests.

2. **Middleware para rutas por rol**  
   En `lib/supabase/middleware.ts`: si la ruta es `/provider`, `/specialist`, `/coordinator` o `/patient` y no hay sesión, redirigir a `/login?next=<path>` antes de ejecutar la página.

3. **Persistir eventos del webhook en `stripe_webhook_events`**  
   En POST /api/stripe/webhook: tras verificar firma, insertar/upsert por `stripe_event_id`; actualizar status (received → processed/ignored/failed). Idempotencia para replays (200 sin reprocesar).

4. **Sentry (o similar)**  
   Integración en servidor (Route Handlers, Server Components). Variables en env, sin PII en logs. Documentar en README/ENV.

5. **Completar rebrand MedVoyage**  
   Sustituir todos los "Nebula Smile" por `branding.*` o "MedVoyage Smile" según REBRAND_AUDIT_MEDVOYAGE (UI, metadata, health/status, docs prioritarios).

6. **Forgot password**  
   Enlace en /login que llame a `resetPasswordForEmail` de Supabase; página o mensaje de “revisa tu email”.

7. **SECURITY.md y regla de escrituras**  
   Reemplazar placeholder de contacto en SECURITY.md. Añadir en DATA_MODEL o ENGINEERING_HANDBOOK la regla: tablas sensibles solo escritura desde Route Handlers con guards y getServerSupabase().

---

# 4. Qué mejoraría (sin cambiar comportamiento core)

1. **Tipos TypeScript vs Supabase**  
   Ejecutar `supabase gen types typescript` y usar tipos generados en lib/* para alinear con el esquema y reducir desajustes.

2. **Cobertura de tests**  
   Listar rutas API y páginas críticas; añadir tests para las que no tengan (prioridad: webhook con mock de stripe_webhook_events, signup con rate limit).

3. **Accesibilidad y UX de formularios**  
   Cerrar F1–F4: contraste, focus, labels, mensajes de error que no revelen datos internos, estados de carga en botones/forms para evitar doble submit.

4. **Documentación operativa**  
   Una sola “guía UTM y atribución” (qué se guarda, cómo verlo en admin, ejemplos para campañas). Revisar que README, DATA_MODEL y CURATED_NETWORK reflejen el esquema actual.

5. **E2E mínimo**  
   Playwright: assessment → thank-you (y opcionalmente proposal). Ejecutable en CI o local; no bloqueante para merge si es costoso.

6. **Doc RLS para go-live**  
   Checklist o párrafo en DATA_MODEL o RLS_REVIEW: revisar políticas en Supabase antes de go-live; no ampliar escritura a leads/payments sin revisión.

7. **Logging**  
   Revisar createLogger: que en nivel info no se incluya PII; ajustar donde haga falta.

---

# 5. Qué falta / está pendiente (resumen)

## 5.1 Bloqueantes para “Deploy ✅”

| # | Tarea | Responsable | Doc |
|---|--------|-------------|-----|
| 1 | Verificar webhook Stripe 200 (Send test en Dashboard) | Humano/DevOps | NEXT_TASKS 8, PLAN_MEJORAS S1.1 |
| 2 | Una E2E humana: assessment → thank-you → admin (o patient) → Collect deposit → Stripe 4242 → verificar en Supabase | Humano/QA | NEXT_TASKS 9, TEST_FIRST_SALE |
| 3 | Marcar DEPLOY_CHECKLIST y CHECKLIST_PRIMERA_VENTA; poner Deploy ✅ en STATUS | QA/Repo | NEXT_TASKS 10, S1.3 |

## 5.2 Sprints de mejoras (plan ya definido)

| Sprint | Contenido | Doc |
|--------|-----------|-----|
| **S1** | Cierre lanzamiento: SECURITY.md contacto, regla escrituras sensibles, URL prod documentada | PLAN_MEJORAS_PRODUCCION_POR_SPRINT |
| **S2** | Rate limit signup/login, middleware rutas por rol | Idem |
| **S3** | Persistir eventos webhook en stripe_webhook_events, doc email confirmation | Idem |
| **S4** | Sentry, E2E opcional, doc RLS | Idem |
| **S5** | Forgot password, dominio custom, staging opcional | Idem |
| **S6** (auditoría) | Analytics, meta por página, doc UTM, rebrand completo | AUDIT_AND_IMPROVEMENT_PLAN |

## 5.3 Auditoría buenas prácticas (tareas sin cerrar)

| Área | Tareas pendientes | Doc |
|------|-------------------|-----|
| Validación | V3: tipos TS / supabase gen types | TAREAS_AUDITORIA_BUENAS_PRACTICAS |
| Tests | T1 cobertura, T2 E2E, T3 integración | Idem |
| Frontend | F1 accesibilidad, F2 errores, F3 loading, F4 SEO | Idem |
| Infra | I1 env, I2 migraciones, I3 CI | Idem |
| Documentación | D1 README, D2 modelo de datos | Idem |
| Mejoras opcionales | M1 logging, M2 Sentry doc, M3 admin UI requireAdmin | Idem |

## 5.4 Producto y crecimiento (backlog)

- Dominio custom y posible staging.
- Analytics (Vercel Analytics o PostHog) para funnel y atribución.
- Agente de marketing en admin (generar headlines/CTAs) si se prioriza.
- Revisión de og:image y meta por página de tratamiento para compartir en redes.

---

# 6. Resumen ejecutivo

| Dimensión | Valoración | Siguiente paso |
|-----------|------------|----------------|
| **Estructura** | Clara y modular (app, lib, migraciones, docs). | Mantener convenciones; evitar duplicar responsabilidades. |
| **Backend** | Sólido (Zod, guards, RLS, idempotencia pagos). | Rate limit auth, persistencia webhook, middleware por rol. |
| **Frontend** | Listo para vender (landing, assessment, admin, dashboards). | Rebrand completo, accesibilidad/loading/errores. |
| **DevOps** | CI y scripts en buen estado. | Deploy ✅ (verificación humana), Sentry, opcional staging. |
| **Pendiente crítico** | Deploy ✅ + Sprint 1 (docs/seguridad) + Sprint 2 (rate limit + middleware). | Ejecutar en ese orden; luego S3–S5 según prioridad. |

**Conclusión:** La plataforma está en estado “casi listo para producción” con un plan de mejoras bien definido. Lo que más falta es la verificación humana (webhook + primera venta E2E), cerrar documentación de seguridad y URL de producción, y endurecer auth (rate limit + middleware). Después, persistencia de eventos Stripe, Sentry y rebrand completan el cuadro para un lanzamiento estable y auditable.
