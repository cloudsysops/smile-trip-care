# Síntesis del proyecto — Qué está listo, qué falla y plan de mejoras

**Última actualización:** 2026-03-11

---

## 1. Síntesis en una frase

La plataforma está **técnicamente sólida y lista para vender**: funnel assessment → lead → admin → depósito Stripe y motores de crecimiento (Reddit discovery, follow-up AI, analytics) están implementados; lo que falta es **verificación humana** (webhook + primera venta E2E), **cierre de seguridad** (rate limit auth, SECURITY.md) y **mejoras de observabilidad y branding**.

---

## 2. Qué está listo y funcional

| Área | Qué funciona |
|------|----------------|
| **Funnel principal** | Landing → Assessment → POST /api/leads → Thank-you; honeypot, rate limit, UTM y atribución guardados. |
| **Admin** | Login admin, listado y detalle de leads, cambio de estado, recomendación de paquete, notas de follow-up. |
| **AI Lead Copilot** | Generar resumen, prioridad y borradores WhatsApp/email por lead; botón "Open in WhatsApp"; reutilizar resultado hasta Regenerate. |
| **Follow-up Engine** | Generar mensajes 24h, 3 días y 7 días por lead; Copy y Open WhatsApp en la página del lead. |
| **Outbound** | Cola de mensajes (AI/manual), aprobación, envío, worker con reintentos; command center con métricas. |
| **Stripe** | Checkout desde admin o paciente; webhook con firma e idempotencia por session; validación paid. |
| **Pagos** | Depósito por paquete; webhook actualiza lead/booking; reconciliación con secret. |
| **Automation** | Cola durable (triage, respond, itinerary, outbound); workers con locks y dead-letter. |
| **Growth** | Reddit discovery (`npm run growth:leads`), AI responder Reddit, `data/reddit-leads.json`. |
| **Analytics** | `/admin/analytics`: total/today/week leads, high priority, packages, % package interest, gráfico por país (recharts). |
| **Auth y roles** | Login, signup (opcional), dashboards /patient, /provider, /specialist, /coordinator; guards por rol. |
| **CI/CD** | `npm run verify` (lint + test + build); GitHub Actions; deploy_verify a dev. |
| **Docs** | STATUS, NEXT_TASKS, DEPLOY_CHECKLIST, TEST_FIRST_SALE, ENV_Y_STRIPE, plan de mejoras por sprint. |

---

## 3. Qué está pendiente (no bloquea uso diario)

| # | Pendiente | Responsable | Doc |
|---|-----------|-------------|-----|
| 1 | **Verificación humana webhook:** Stripe Dashboard → Send test webhook (checkout.session.completed) → confirmar 200. | DevOps/QA | NEXT_TASKS #8 |
| 2 | **Flujo E2E primera venta:** assessment → thank-you → signin → admin → Collect deposit → Stripe 4242 → comprobar en Supabase. | QA | NEXT_TASKS #9, TEST_FIRST_SALE |
| 3 | **Cerrar Deploy:** Marcar checklists y poner **Deploy ✅** en STATUS.md. | Repo/QA | NEXT_TASKS #10 |
| 4 | **SECURITY.md:** Sustituir placeholder "indicar email de contacto" por email real (o instrucción de contacto). | Repo | PLAN_MEJORAS S1.4 |
| 5 | **Regla de escrituras sensibles:** Documentar en DATA_MODEL o ENGINEERING_HANDBOOK (solo Route Handlers con guards + getServerSupabase). | Backend/Repo | PLAN_MEJORAS S1.5 |
| 6 | **Rate limit signup (y opcional login):** Evitar abuso en POST /api/signup. | Backend | PLAN_MEJORAS S2 |
| 7 | **Middleware por rol:** Redirigir a /login cuando no hay sesión en /provider, /specialist, /coordinator, /patient. | Backend | PLAN_MEJORAS S2.3 |
| 8 | **Persistir eventos webhook** en `stripe_webhook_events` (auditoría pagos). | Backend | PLAN_MEJORAS S3 |
| 9 | **Sentry** (o similar) para errores en producción. | Backend/DevOps | PLAN_MEJORAS S4 |
| 10 | **Rebrand completo:** Sustituir "Nebula Smile" por MedVoyage Smile donde quede hardcodeado. | Frontend | AUDIT_AND_IMPROVEMENT_PLAN, REBRAND_AUDIT |

---

## 4. Qué falla o puede fallar (botones / flujos)

| Qué | Dónde | Notas |
|-----|--------|--------|
| **Tests:** "Lead-created automation enqueue failed" con `upsert is not a function` | Solo en tests (mock de Supabase sin `.upsert`) | No es fallo en producción; el cliente real de Supabase sí tiene `upsert`. Opcional: mejorar mock en tests para incluir `upsert`. |
| **Envío real Outbound** | Worker y providers | Depende de configuración (WhatsApp/email); sin provider real los envíos fallan o simulan. Revisar env y providers. |
| **Reddit discovery** | `npm run growth:leads` | Requiere red; Reddit puede devolver 429 si no hay User-Agent adecuado. Ya se usa User-Agent; si falla, revisar límites de Reddit. |
| **Follow-up / Copilot** | Admin lead detail | Si no hay `OPENAI_API_KEY`, se usan fallbacks (texto genérico); no “fallan” pero el texto es menos personalizado. |
| **Analytics** | /admin/analytics | Si no hay leads con `country`, el gráfico “Leads by country” sale vacío (comportamiento esperado). |

No hay botones rotos en la UI que impidan el flujo principal (assessment → lead → admin → depósito). Cualquier fallo suele ser por env (API keys, Stripe, Supabase) o por pruebas con mocks.

---

## 5. Plan de trabajo de mejoras (orden sugerido)

### Fase A — Cierre de lanzamiento (humano + docs)

1. **Humano:** Verificar webhook Stripe (test 200) y ejecutar una vez el flujo E2E de primera venta.
2. **Repo:** Marcar DEPLOY_CHECKLIST y CHECKLIST_PRIMERA_VENTA; poner Deploy ✅ en STATUS.
3. **Repo:** SECURITY.md con contacto real (o instrucción).
4. **Repo:** Documentar regla de escrituras sensibles (Route Handlers + guards) y URL de producción.

**Doc:** [PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md](PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md) Sprint 1.

---

### Fase B — Seguridad y rutas

5. **Backend:** Rate limit en POST /api/signup (ej. 5 intentos / 15 min por IP).
6. **Backend:** (Opcional) POST /api/auth/login con rate limit o documentar que login queda client-side.
7. **Backend:** Middleware: redirigir a /login en /provider, /specialist, /coordinator, /patient si no hay sesión.
8. **QA:** `npm run verify` y tests de rate limit.

**Doc:** PLAN_MEJORAS Sprint 2.

---

### Fase C — Pagos y auditoría

9. **Backend:** En el webhook de Stripe, insertar/actualizar `stripe_webhook_events` (idempotencia por `stripe_event_id`).
10. **Backend:** Tests que comprueben registro de eventos en webhook (con mock).
11. **Repo:** Documentar flujo de confirmación de email (Supabase) en AUTH_AND_ROLES.

**Doc:** PLAN_MEJORAS Sprint 3.

---

### Fase D — Observabilidad y calidad

12. **Backend/DevOps:** Integrar Sentry (DSN en env, sin PII).
13. **QA (opcional):** E2E assessment → thank-you (Playwright).
14. **Repo:** Documentar revisión RLS antes de go-live (DATA_MODEL o RLS_REVIEW).

**Doc:** PLAN_MEJORAS Sprint 4.

---

### Fase E — UX y branding (backlog)

15. **Frontend:** Reemplazar "Nebula Smile" por MedVoyage Smile en todo el repo (ver REBRAND_AUDIT_MEDVOYAGE).
16. **Frontend:** Cerrar tareas de accesibilidad (contraste, focus, labels) en TAREAS_AUDITORIA.
17. **Frontend (opcional):** Forgot password con Supabase `resetPasswordForEmail`.
18. **DevOps (opcional):** Dominio custom, staging, SECURITY.md contacto.

**Doc:** PLAN_MEJORAS Sprint 5, AUDIT_AND_IMPROVEMENT_PLAN.

---

## 6. Resumen rápido

- **Listo:** Funnel, admin, AI Copilot, follow-up, outbound, Stripe, automation, growth (Reddit + analytics), auth y roles, verify y deploy_verify.
- **Pendiente:** Verificación humana (webhook + primera venta), SECURITY.md, rate limit auth, middleware por rol, persistencia webhook, Sentry, rebrand.
- **Qué “falla”:** Solo en tests (mock sin upsert); outbound/Reddit dependen de config; sin OpenAI se usan fallbacks. Nada crítico que rompa el flujo de venta.
- **Plan:** A (cierre lanzamiento) → B (seguridad) → C (webhook/auditoría) → D (Sentry, E2E, RLS) → E (branding, accesibilidad, opcionales).

Para ejecutar tareas concretas, usar [NEXT_TASKS.md](NEXT_TASKS.md) y [PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md](PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md).
