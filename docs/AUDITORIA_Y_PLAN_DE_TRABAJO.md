# Auditoría y plan de trabajo — Nebula Smile

**Fecha:** 2026-03-08  
**Objetivo:** Resumen del estado actual (auditoría) y plan de trabajo priorizado para ejecutar por agentes o humanos.

---

## 1. Auditoría — Estado actual

### Código y CI
| Ítem | Estado |
|------|--------|
| `npm run verify` (lint + test + build) | ✅ Pasa |
| CI en `main` | ✅ Verde (post PR #25, #26) |
| Rama principal | `main`; despliegue Vercel desde `main` |

### Módulos y funcionalidad (STATUS.md)
- **M1–M19, Marketplace, Curated network, Auth, Dashboards, Production readiness:** ✅ Hechos.
- **Deploy (Vercel + Stripe + Supabase):** 🔶 Casi listo — un solo proyecto Vercel (`-dev`), env y webhook configurados; smoke OK.

### Rutas verificadas (post PR #26)
- `/`, `/packages`, `/assessment`, `/thank-you`, `/patient` (307 cuando no logueado), `/api/health`, `/api/health/ready` — responden correctamente en la URL de dev.

### Pendiente de datos en producción
- **Landing package links:** Los tres slugs (`essential-care-journey`, `comfort-recovery-journey`, `premium-transformation-experience`) pueden 404 en producción hasta que se ejecute el **packages-only SQL** en Supabase (ver [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md)).

### Documentos de referencia
- **Tareas inmediatas:** [NEXT_TASKS.md](NEXT_TASKS.md)
- **Plan por fases:** [PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md)
- **Sprints de mejoras:** [PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md](PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md)
- **Auditoría buenas prácticas:** [TAREAS_AUDITORIA_BUENAS_PRACTICAS.md](TAREAS_AUDITORIA_BUENAS_PRACTICAS.md)

---

## 2. Plan de trabajo priorizado

### Bloque 1 — Cierre de lanzamiento (humano / DevOps / QA)

Estas tareas requieren ejecución manual (Stripe, flujo E2E, Supabase). No cambian código; cierran el track Deploy.

| # | Tarea | Responsable | Doc |
|---|--------|--------------|-----|
| 1 | **Stripe:** En Dashboard → Webhooks → Send test webhook (`checkout.session.completed`) → verificar 200. | DevOps | DEPLOY_CHECKLIST §2 |
| 2 | **Flujo E2E:** Assessment → thank-you → signin → admin → Collect deposit → Stripe 4242 → verificar en Supabase (payments, leads). | QA | [TEST_FIRST_SALE.md](TEST_FIRST_SALE.md) |
| 3 | **Supabase producción:** Ejecutar packages-only SQL (Option B) en SQL Editor para que los 3 slugs de la landing resuelvan. Verificación: `SELECT slug, name, published FROM public.packages WHERE slug IN (...)`; smoke test en `/packages/<slug>`. | DevOps | [PRODUCTION_PACKAGE_SLUGS_FIX.md](PRODUCTION_PACKAGE_SLUGS_FIX.md) |
| 4 | Marcar DEPLOY_CHECKLIST y CHECKLIST_PRIMERA_VENTA; poner **Deploy ✅** en STATUS.md; documentar URL de producción en README o PLAN_AGENTES. | Repo/QA | NEXT_TASKS Fase 1 |

---

### Bloque 2 — Documentación y seguridad (Sprint 1 — SAFE)

Solo documentación y verificación; sin tocar lógica crítica.

| # | Tarea | Responsable | Doc |
|---|--------|--------------|-----|
| 5 | Sustituir en SECURITY.md el placeholder de contacto por email real o instrucción de contacto. | Repo/CI | PLAN_MEJORAS S1.4 |
| 6 | Añadir en DATA_MODEL o ENGINEERING_HANDBOOK regla: escrituras sensibles solo desde Route Handlers con requireAdmin/scope + getServerSupabase(); no exponer service role al cliente. | Backend/Repo | PLAN_MEJORAS S1.5 |
| 7 | Documentar URL de producción (y dominio custom si aplica) en README o PLAN_AGENTES. | Repo/CI | PLAN_MEJORAS S1.6 |

---

### Bloque 3 — Seguridad y auth (Sprint 2 — MODERATE)

Rate limit en signup/login y middleware por rol.

| # | Tarea | Responsable | Doc |
|---|--------|--------------|-----|
| 8 | Rate limit en POST /api/signup (por IP; ej. 5 intentos / 15 min); 429 si se excede. | Backend | PLAN_MEJORAS S2.1 |
| 9 | Rate limit en login: (A) POST /api/auth/login con rate limit, o (B) documentar. | Backend | PLAN_MEJORAS S2.2 |
| 10 | Middleware: redirigir a /login?next=<path> para /provider, /specialist, /coordinator, /patient si no hay usuario. | Backend | PLAN_MEJORAS S2.3 |
| 11 | Verify + tests para rate limit signup (y login si aplica). | Backend/QA | PLAN_MEJORAS S2.4 |

---

### Bloque 4 — Webhook y pagos (Sprint 3 — MODERATE)

Auditoría del webhook y persistencia de eventos.

| # | Tarea | Responsable | Doc |
|---|--------|--------------|-----|
| 12 | En webhook Stripe: insertar/upsert en `stripe_webhook_events` (stripe_event_id, event_type, status); idempotencia por event_id. | Backend | PLAN_MEJORAS S3.1, S3.2 |
| 13 | Tests que verifiquen inserción en stripe_webhook_events (mock Supabase). | Backend | PLAN_MEJORAS S3.3 |
| 14 | Documentar en AUTH_AND_ROLES flujo "Confirm email" de Supabase si está activo. | Repo/Frontend | PLAN_MEJORAS S3.4 |

---

### Bloque 5 — Observabilidad y QA (Sprint 4)

| # | Tarea | Responsable | Doc |
|---|--------|--------------|-----|
| 15 | Añadir Sentry (o similar) para errores en producción. | Backend | PLAN_AGENTES M2 |
| 16 | Documentar revisión de políticas RLS antes de go-live real. | Backend/Supabase | PLAN_AGENTES M3 |
| 17 | Valorar test E2E mínimo (assessment → thank-you); documentar si se añade. | QA | TAREAS_AUDITORIA T2, PLAN_MEJORAS S4 |

---

### Bloque 6 — Auditoría buenas prácticas (pendientes)

Tareas de [TAREAS_AUDITORIA_BUENAS_PRACTICAS.md](TAREAS_AUDITORIA_BUENAS_PRACTICAS.md) aún no marcadas.

| # | Tarea | Responsable |
|---|--------|-------------|
| 18 | V3: Tipos TypeScript en lib/* alineados con Supabase; opcional supabase gen types. | Backend |
| 19 | T1: Listar rutas API sin test; prioridad leads, webhook, health. | QA/Backend |
| 20 | T3: Documentar .env.test o mocks en tests; verify sin credenciales prod. | Backend/QA |
| 21 | F1–F4: Accesibilidad, mensajes de error, loading, SEO/meta (verificar aplicado). | Frontend |
| 22 | Infra: Revisar ítems de TAREAS_AUDITORIA §5 (infra y configuración). | DevOps/Repo |

---

## 3. Orden sugerido de ejecución

1. **Bloque 1** (cierre lanzamiento) — cuando haya acceso a Stripe, Supabase prod y tiempo para E2E.
2. **Bloque 2** (docs y seguridad) — rápido, sin riesgo.
3. **Bloque 3** (rate limit + middleware) — requiere diseño y tests.
4. **Bloque 4** (webhook events) — toca flujo de pagos; revisar idempotencia.
5. **Bloque 5** y **Bloque 6** — en paralelo o según capacidad (observabilidad, RLS, E2E, auditoría restante).

---

## 4. Reglas para agentes

- **No parar:** Al terminar una tarea, tomar la siguiente del plan según tu tipo (Repo/CI, Frontend, Backend, QA, DevOps).
- **Verify:** Antes de cerrar sesión, `npm run verify` debe pasar.
- **Git:** Commit + push al terminar trabajo; no dejar cambios sin commitear.
- **Docs:** Marcar [x] en NEXT_TASKS, PLAN_MEJORAS o TAREAS_AUDITORIA al completar; actualizar STATUS.md si se cierra Deploy.

---

*Documento generado a partir de STATUS.md, NEXT_TASKS.md, PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md, PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md y TAREAS_AUDITORIA_BUENAS_PRACTICAS.md.*
