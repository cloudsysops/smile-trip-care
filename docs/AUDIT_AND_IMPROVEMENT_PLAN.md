# Auditoría completa y plan de mejoras

**Proyecto:** Smile Transformation Platform (MedVoyage Smile)  
**Fecha:** 2026-03-08  
**Ámbitos:** Backend, Frontend, DevOps, Integración, Marketing, Branding  
**Objetivo:** Reporte de estado actual y plan priorizado para lanzamiento y mejoras continuas.

---

## Resumen ejecutivo

| Área        | Estado   | Riesgos principales                         | Prioridad siguiente      |
|------------|----------|--------------------------------------------|--------------------------|
| Backend    | ✅ Sólido | Rate limit auth, persistencia webhook       | Sprint 2–3               |
| Frontend   | ✅ Listo | Accesibilidad, loading states, copy        | Sprint 1 + branding      |
| DevOps     | 🔶 Casi  | Deploy ✅ pendiente, Sentry, staging        | Cierre lanzamiento       |
| Integración| ✅ OK    | Stripe/Supabase/AI operativos              | Auditoría webhook        |
| Marketing  | 🔶 Parcial | UTM capturado; sin analytics/attribution  | Post-lanzamiento         |
| Branding   | 🔶 En transición | MedVoyage en lib; hardcoded Nebula en varios | Sprint branding |

**Conclusión:** La plataforma está lista para vender tras verificación humana (webhook + primera venta E2E). Las mejoras siguientes priorizan seguridad (rate limit auth), auditoría de pagos (webhook events) y observabilidad (Sentry), seguidas de branding consistente y marketing/analytics.

---

# PARTE 1 — AUDITORÍA POR ÁREA

---

## 1. Backend

### Estado actual

- **APIs:** 42 route handlers; públicos: `POST /api/leads`, `GET /api/health`, `GET /api/health/ready`, `GET /api/status`. Resto con auth o firma Stripe.
- **Validación:** Zod en leads, checkout, webhook; honeypot y rate limit en `/api/leads`.
- **Auth:** `requireAdmin`, `requirePatient`, etc.; servicio con `getServerSupabase()`; service role solo servidor.
- **Stripe webhook:** Firma verificada, solo `checkout.session.completed` con `payment_status=paid`; idempotencia por session_id; **no persiste** eventos en `stripe_webhook_events`.
- **Tests:** 69 tests (Vitest); leads, stripe, health, auth, automation, outbound cubiertos. Sin E2E.

### Fortalezas

- Contratos claros (Zod), RLS en tablas críticas, idempotencia en pagos, guards por rol consistentes.
- Automatización (triage, respond, itinerary, workers) y cola durable con reintentos.

### Gaps y riesgos

| # | Gap / riesgo | Impacto | Ref |
|---|----------------|--------|-----|
| 1 | Sin rate limit en signup/login | Abuso, credential stuffing | CTO audit, PLAN_MEJORAS S2 |
| 2 | Webhook no escribe en `stripe_webhook_events` | Sin auditoría ni métricas de eventos | CTO audit, S3 |
| 3 | Middleware solo protege `/admin*`; provider/specialist/coordinator/patient solo en página | Superficie de ataque mayor | CTO audit |
| 4 | Tipos TS vs Supabase: no generados con `supabase gen types` | Desalineación posible | TAREAS_AUDITORIA V3 |
| 5 | Cobertura de tests: no todas las rutas API tienen test explícito | Regresiones posibles | TAREAS_AUDITORIA T1 |

### Recomendaciones backend

- Añadir rate limit a `POST /api/signup` (y opcionalmente login) — Sprint 2.
- Persistir eventos en `stripe_webhook_events` en el webhook, con idempotencia por `stripe_event_id` — Sprint 3.
- Extender middleware para redirigir a `/login` en rutas por rol cuando no hay sesión — Sprint 2.
- Documentar regla: tablas sensibles solo escritura desde Route Handlers con guards y `getServerSupabase()` — Sprint 1.

---

## 2. Frontend

### Estado actual

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind.
- **Rutas:** Landing, assessment, packages, thank-you, login/signup/signin, admin, dashboards por rol (patient, provider, specialist, coordinator).
- **Branding:** `lib/branding.ts` con MedVoyage Smile; varios componentes aún con "Nebula Smile" hardcodeado (ver REBRAND_AUDIT_MEDVOYAGE.md).
- **Meta/SEO:** Meta tags en layout y varias páginas; documentado en NEXT_TASKS.
- **Accesibilidad:** Sprint “Salir a vender” incluyó contraste, focus, alt; tareas F1–F4 en TAREAS_AUDITORIA pendientes de cerrar.

### Fortalezas

- Estructura clara (landing, assessment, thank-you, dashboards); conversión y CTAs trabajados (CONVERSION_LANDING_REPORT).
- Favicon, footer legal, responsive y CTAs tocables ya revisados (Sprint Salir a vender).

### Gaps y riesgos

| # | Gap / riesgo | Impacto | Ref |
|---|----------------|--------|-----|
| 1 | Hardcoded "Nebula Smile" en signin, legal, LeadCopyButtons, SpecialistAbout, WhatsAppButton, health/status, etc. | Marca inconsistente | REBRAND_AUDIT_MEDVOYAGE |
| 2 | Accesibilidad: revisión formal (contraste, focus, labels) no cerrada | Riesgo inclusividad / cumplimiento | TAREAS_AUDITORIA F1 |
| 3 | Mensajes de error: asegurar que no revelan datos internos | Seguridad / UX | TAREAS_AUDITORIA F2 |
| 4 | Loading/estados en formularios y botones (evitar doble submit) | UX | TAREAS_AUDITORIA F3 |
| 5 | Forgot password no implementado | Recuperación de cuenta | PLAN_MEJORAS S5 |

### Recomendaciones frontend

- Completar rebrand: sustituir todos los "Nebula Smile" por `branding.*` o "MedVoyage Smile" según REBRAND_AUDIT_MEDVOYAGE (fases 2–5).
- Cerrar tareas F1–F4 de TAREAS_AUDITORIA (accesibilidad, errores, loading, SEO).
- Añadir "¿Olvidaste tu contraseña?" con `resetPasswordForEmail` de Supabase — Sprint 5.

---

## 3. DevOps

### Estado actual

- **CI:** GitHub Actions en push/PR a main, staging, dev, feature/*, hotfix/*: `npm ci`, lint, test, env_check, build. Sin deploy automático a producción desde CI.
- **Deploy:** Vercel; un solo proyecto (ej. smile-transformation-platform-dev); rama producción `main`. Scripts: `verify_all.sh`, `deploy_verify.sh`, `smoke_test.sh`, `verify_production.sh`.
- **Env:** `.env.example` y docs (ENV_Y_STRIPE, ENVIRONMENT_STRATEGY); CI con placeholders. No hay staging DB documentado como obligatorio.
- **Migrations:** 0001–0020; orden en MIGRATION_ORDER.md; `npm run db:migrate` con proyecto enlazado.

### Fortalezas

- Verify (lint + test + build) y deploy_verify usados; branch strategy y BRANCH_PROTECTION_SETUP documentados.
- Env check en CI; secrets no en repo.

### Gaps y riesgos

| # | Gap / riesgo | Impacto | Ref |
|---|----------------|--------|-----|
| 1 | Deploy "Casi listo": falta verificación humana (webhook 200, primera venta E2E) y Deploy ✅ en STATUS | Bloquea cierre formal de lanzamiento | NEXT_TASKS 8–10, S1 |
| 2 | Sin Sentry (ni similar) en producción | Errores no visibles | PLAN_MEJORAS S4, MEJORAS M2 |
| 3 | SECURITY.md con placeholder "indicar email de contacto" | Responsable disclosure incompleto | PLAN_MEJORAS S1.4 |
| 4 | Sin entorno staging formal (Vercel Preview + Supabase staging) | Riesgo al probar en prod | PLAN_MEJORAS S5.3 |
| 5 | Dominio custom no configurado | Marca y SEO en subdominio vercel | S5.2 |

### Recomendaciones DevOps

- Cerrar Sprint 1: webhook test 200, una E2E según TEST_FIRST_SALE, actualizar DEPLOY_CHECKLIST y STATUS (Deploy ✅), SECURITY.md con contacto real, documentar URL de producción.
- Integrar Sentry (S4): DSN en env, documentar en README/ENV; no loguear PII.
- Opcional: staging (Vercel Preview + Supabase staging) y dominio custom cuando se defina marca final.

---

## 4. Integración

### Estado actual

- **Supabase:** Auth, Postgres, RLS, Storage (assets). Migraciones 0001–0020; perfiles con role, provider_id, specialist_id.
- **Stripe:** Checkout (amount desde paquete en servidor); webhook con firma; idempotencia; no persiste eventos en tabla.
- **OpenAI:** Triage, respond, itinerary, ops; automation queue + worker; outbound worker. API key opcional en env.
- **Outbound:** Cola de mensajes, aprobación, envío y tracking; worker con reintentos.
- **Attribution:** UTM, referrer, landing_path en leads; admin muestra atribución en detalle de lead.

### Fortalezas

- Flujo assessment → lead → booking → checkout → webhook → actualización lead/booking/payment operativo.
- AI y automatización integrados en admin; outbound con métricas y SLA.

### Gaps y riesgos

| # | Gap / riesgo | Impacto | Ref |
|---|----------------|--------|-----|
| 1 | Webhook no inserta en `stripe_webhook_events` | Sin auditoría ni replay check fácil | Backend §1, S3 |
| 2 | Email confirmation (Supabase): flujo no documentado si está activo | Confusión operativa | PLAN_MEJORAS S3.4 |
| 3 | Sin analytics externo (PostHog, GA, Vercel Analytics) | Métricas de funnel limitadas a DB | ARQUITECTURA_BLUEPRINT, MEJORAS |

### Recomendaciones integración

- Persistir eventos Stripe en webhook (Sprint 3); documentar flujo de confirmación de email en AUTH_AND_ROLES (S3.4).
- Post-lanzamiento: evaluar analytics (PostHog, Vercel Analytics) para funnel y atribución sin duplicar PII.

---

## 5. Marketing

### Estado actual

- **Attribution:** UTM, referrer, landing_path capturados en lead; visibles en admin (lead detail). Migración 0004_leads_attribution.
- **Copy y conversión:** Landing con hero, trust, paquetes, CTAs; thank-you con recomendación; docs CONVERSION_LANDING_REPORT, PR_CTO_ASSESSMENT_INTENT.
- **Contenido:** Páginas por tratamiento (dental-implants, veneers, hollywood-smile Colombia); specialist profiles; tour-experiences, health-packages.
- **Agente marketing:** `agents/marketing-content.md` (admin-only, futuro): headlines, CTAs, sin consejo médico.
- **No hay:** Pixel de conversión, analytics de funnel (GA/PostHog), A/B tests, ni campañas automatizadas documentadas.

### Fortalezas

- Datos de atribución en DB listos para reporting y futura integración con herramientas.
- Copy orientado a conversión y posicionamiento premium (Colombia, confianza, Clínica San Martín).

### Gaps y riesgos

| # | Gap / riesgo | Impacto | Ref |
|---|----------------|--------|-----|
| 1 | Sin herramienta de analytics/funnel en producción | Decisiones de marketing sin datos de comportamiento | ARQUITECTURA_BLUEPRINT, MEJORAS |
| 2 | Sin documentación de "cómo usamos UTM" para campañas | Uso subóptimo de atribución | Interno |
| 3 | Marketing content agent no integrado en UI | Contenido manual o externo | agents/marketing-content.md |
| 4 | Sin meta tags por página de tratamiento (og:image, etc.) en detalle | Compartir en redes menos efectivo | SEO |

### Recomendaciones marketing

- Documentar en README o doc operativo: "Uso de UTM y atribución" (qué se guarda, cómo verlo en admin, ejemplos para campañas).
- Post-lanzamiento: integrar analytics (Vercel Analytics o PostHog) con eventos clave (landing view, assessment start/complete, thank-you, checkout start/complete); respetar privacidad y sin PII en eventos.
- Opcional: exponer agente de marketing en admin (generar headlines/CTAs) cuando se priorice contenido dinámico.
- Revisar og:image y meta por página de tratamiento para compartir en redes.

---

## 6. Branding

### Estado actual

- **Fuente única:** `lib/branding.ts`: `productName: "MedVoyage Smile"`, `companyName: "MedVoyage"`, `tagline`, `supportCopy`.
- **Uso parcial:** Varias páginas usan `branding.*`; otras tienen "Nebula Smile" o "Nebula Nexus" hardcodeado (signin, legal, LeadCopyButtons, SpecialistAbout, WhatsAppButton, health/status, Stripe checkout display name, metadata en varias páginas). Ver REBRAND_AUDIT_MEDVOYAGE.md.
- **Docs:** README, STATUS, AGENTS y 30+ docs siguen mencionando "Nebula Smile" donde el nombre del producto es visible u operativo.
- **Favicon:** `app/icon.svg` (o icon.png) documentado en README.

### Fortalezas

- Un solo archivo de configuración de marca; cambio centralizado en `lib/branding.ts`.
- Rebrand a MedVoyage ya iniciado; auditoría de archivos hecha.

### Gaps y riesgos

| # | Gap / riesgo | Impacto | Ref |
|---|----------------|--------|-----|
| 1 | Hardcoded "Nebula Smile" en UI y APIs (health, status) | Marca inconsistente ante usuario y en respuestas API | REBRAND_AUDIT §1–2 |
| 2 | Metadata (title, og) en páginas con "Nebula Smile" | SEO y compartir con marca antigua | REBRAND_AUDIT §2 |
| 3 | Docs operativos (README, STATUS, TEST_FIRST_SALE, DEPLOY_CHECKLIST, etc.) con nombre antiguo | Confusión para equipo y agentes | REBRAND_AUDIT §3 |
| 4 | Dominio y nombre de proyecto Vercel no alineados con MedVoyage (ej. smile-transformation-platform-dev) | Coherencia de marca en URL | S5.2 |

### Recomendaciones branding

- Completar fases 2–5 de REBRAND_AUDIT_MEDVOYAGE: reemplazar todos los hardcoded por `branding.*` o "MedVoyage Smile"; actualizar metadata y docs prioritarios (README, STATUS, AGENTS, OPERATIONS_INDEX, TEST_FIRST_SALE, ENVIRONMENTS, DEPLOYMENT_STRATEGY, VERCEL_PRODUCTION_VERIFICATION_GUIDE).
- Health/status: usar `branding.productName` o slug derivado (ej. "medvoyage-smile") en `service` / `app` para coherencia.
- Cuando se defina URL final: configurar dominio custom en Vercel y, si aplica, renombrar proyecto para alineación con MedVoyage.

---

# PARTE 2 — PLAN DE MEJORAS PRIORIZADO

Objetivo: cerrar lanzamiento, endurecer seguridad y trazabilidad, mejorar observabilidad y consistencia de marca; después marketing y analytics.

---

## Matriz de prioridad (por área)

| Prioridad | Backend | Frontend | DevOps | Integración | Marketing | Branding |
|-----------|---------|----------|--------|-------------|-----------|----------|
| **P0 (bloqueante lanzamiento)** | — | — | Deploy ✅, webhook 200, 1ª venta E2E, SECURITY.md | — | — | — |
| **P1 (inmediato post-lanzamiento)** | Rate limit auth, middleware roles | Rebrand UI, accesibilidad/errores/loading | Sentry, doc URL prod | Webhook events, doc email | Doc UTM/attribution | Rebrand completo (UI + docs) |
| **P2 (corto plazo)** | Persist webhook events | Forgot password, meta por página | Staging opcional, env doc | — | Analytics (Vercel/PostHog) | Dominio custom |
| **P3 (backlog)** | Gen types Supabase, más tests API | — | Staging formal | — | Marketing agent en admin, og:image | — |

---

## Sprints consolidados (alineados con PLAN_MEJORAS_PRODUCCION_POR_SPRINT)

### Sprint 1 — Cierre de lanzamiento y seguridad básica (SAFE)

- **DevOps/QA:** Verificar webhook Stripe 200 (Send test); ejecutar TEST_FIRST_SALE una vez; marcar DEPLOY_CHECKLIST y CHECKLIST_PRIMERA_VENTA; poner **Deploy ✅** en STATUS.md.
- **Repo:** Sustituir placeholder en SECURITY.md por contacto real; documentar URL de producción en README o PLAN_AGENTES; añadir regla en DATA_MODEL o ENGINEERING_HANDBOOK: escrituras sensibles solo desde Route Handlers con guards y getServerSupabase().

**Salida:** Deploy cerrado, SECURITY.md usable, regla de escrituras documentada, URL prod documentada.

---

### Sprint 2 — Seguridad: rate limit auth y middleware por rol (MODERATE)

- **Backend:** Rate limit en `POST /api/signup` (por IP, ej. 5/15 min); opcionalmente `POST /api/auth/login` con rate limit o documentar que login es client-side.
- **Backend:** Middleware: redirigir a `/login?next=<path>` cuando la ruta sea `/provider`, `/specialist`, `/coordinator` o `/patient` y no haya usuario.
- **QA:** Verify en verde; tests para rate limit signup (y login si aplica).

**Salida:** Signup (y opcionalmente login) limitado; rutas por rol protegidas también en middleware.

---

### Sprint 3 — Pagos: auditoría webhook y documentación (MODERATE)

- **Backend:** En webhook Stripe: tras verificar firma, insertar (o upsert por `stripe_event_id`) en `stripe_webhook_events`; para eventos procesados/ignorados actualizar status; idempotencia por event_id (replay → 200).
- **Backend:** Tests que verifiquen inserción en `stripe_webhook_events` (mock Supabase).
- **Repo/Frontend:** Documentar en AUTH_AND_ROLES el flujo de confirmación de email (Supabase) y troubleshooting si el perfil no se crea.

**Salida:** Auditoría de eventos Stripe en DB; documentación clara de email confirmation.

---

### Sprint 4 — Observabilidad y calidad (MODERATE / SAFE)

- **Backend/DevOps:** Integrar Sentry (DSN en env, sin PII en logs); documentar en README o ENV_Y_STRIPE.
- **QA (opcional):** E2E mínimo (assessment → thank-you) con Playwright o similar; ejecutable en CI o local; no bloqueante.
- **Backend/Repo:** Documentar revisión RLS antes de go-live (DATA_MODEL o RLS_REVIEW).
- **Cualquiera:** Ejecutar `npm run verify` tras cambios.

**Salida:** Sentry activo; opcional E2E; doc RLS para producción.

---

### Sprint 5 — Branding, marketing y opcionales (SAFE / MODERATE)

- **Frontend/Branding:** Completar rebrand según REBRAND_AUDIT_MEDVOYAGE: todos los hardcoded "Nebula Smile" → `branding.*` o "MedVoyage Smile"; metadata y docs prioritarios actualizados.
- **Frontend:** Forgot password: enlace en /login con resetPasswordForEmail (Supabase).
- **Marketing:** Documentar "Uso de UTM y atribución" (qué se guarda, cómo verlo en admin, ejemplos para campañas).
- **DevOps:** Dominio custom en Vercel cuando se defina URL final; opcional: staging (Vercel Preview + Supabase staging).

**Salida:** Marca consistente MedVoyage Smile; recuperación de contraseña; guía UTM; opcional dominio y staging.

---

### Sprint 6 — Marketing y analytics (post-lanzamiento)

- **Marketing/DevOps:** Integrar analytics (Vercel Analytics o PostHog): eventos clave (landing, assessment start/complete, thank-you, checkout); sin PII.
- **Frontend:** Revisar og:image y meta por página de tratamiento para compartir en redes.
- **Opcional:** Exponer agente de marketing en admin para generar headlines/CTAs.

**Salida:** Datos de funnel; mejor compartir en redes; opcional generación de copy en admin.

---

## Asignación sugerida por tipo de agente

| Agente    | Sprints y tareas típicas |
|-----------|---------------------------|
| **Repo/CI** | S1 (docs, SECURITY, regla escrituras); verificar verify tras cambios. |
| **Backend** | S2 (rate limit, middleware); S3 (webhook events, tests); S4 (Sentry, doc RLS). |
| **Frontend** | S5 (rebrand UI, forgot password); S6 (meta, og:image). |
| **QA**      | S1 (webhook, E2E primera venta); S2 (tests rate limit); S4 (E2E opcional). |
| **DevOps**  | S1 (webhook verificación); S4 (Sentry); S5 (dominio, staging); S6 (analytics). |
| **Marketing/Branding** | S5 (doc UTM, rebrand docs); S6 (analytics, og, agente). |

---

## Orden de ejecución recomendado

1. **Sprint 1** — Cierre lanzamiento (obligatorio para Deploy ✅).
2. **Sprint 2** — Rate limit y middleware (seguridad).
3. **Sprint 3** — Webhook audit (trazabilidad pagos).
4. **Sprint 4** — Sentry y doc RLS (observabilidad).
5. **Sprint 5** — Branding, forgot password, UTM doc, dominio/staging.
6. **Sprint 6** — Analytics, meta por página, opcional agente marketing.

---

## Referencias cruzadas

- [PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md](PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md) — Tareas detalladas S1–S5.
- [CTO_FULL_CURRENT_STATE_AUDIT.md](CTO_FULL_CURRENT_STATE_AUDIT.md) — Estado técnico y riesgos.
- [REBRAND_AUDIT_MEDVOYAGE.md](REBRAND_AUDIT_MEDVOYAGE.md) — Archivos y fases de branding.
- [TAREAS_AUDITORIA_BUENAS_PRACTICAS.md](TAREAS_AUDITORIA_BUENAS_PRACTICAS.md) — Checklist seguridad, validación, tests, frontend, infra, docs.
- [NEXT_TASKS.md](NEXT_TASKS.md) — Tareas inmediatas y Fase 0/1/2.
- [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) — Flujo E2E primera venta.
- [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md) — Variables y Stripe.

---

*Documento vivo. Actualizar estado de sprints y tareas cuando se completen. Última actualización: 2026-03-08.*
