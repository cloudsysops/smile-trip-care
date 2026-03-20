# Tareas de auditoría — Buenas prácticas y mejoras

**Objetivo:** Que un agente o equipo audite el proyecto completo para comprobar cumplimiento de buenas prácticas y proponer mejoras. Ejecutar en orden de prioridad; marcar [x] al completar.

**Última actualización:** 2026-03-08. **Verify:** ✅ lint sin warnings, tests 13/13, build OK.

---

## Estado actual (ejecutado 2026-03-08)

- **npm run verify:** ✅ Lint, test, build pasan.
- **Lint:** Corregidos 2 warnings (variables no usadas en lib/packages.ts y lib/experiences.ts).
- **Tests:** 4 archivos, 13 tests (health, leads API, admin validation, AI schemas).

---

## 1. Seguridad (Backend / DevOps)

| # | Tarea | Responsable | Hecho |
|---|--------|-------------|-------|
| S1 | **API públicas:** Revisar que solo `/api/leads` (POST) y `/api/health`, `/api/health/ready`, `/api/status` sean accesibles sin auth. El resto (admin, stripe webhook) debe exigir auth o firma. | Backend | [x] |
| S2 | **Rate limiting:** Confirmar que POST /api/leads tiene rate limit (ej. 10/min por IP) y que no hay otros endpoints públicos que deban limitarse. Documentar en README o ENV si aplica. | Backend | [x] |
| S3 | **Secrets:** Verificar que no hay claves (Stripe, Supabase, OpenAI) en código ni en logs. Revisar getServerConfig() y uso de variables de entorno. | Backend/DevOps | [x] |
| S4 | **Stripe webhook:** Confirmar validación de firma en todas las ramas y que no se procesa payload sin signature válida. | Backend | [x] |
| S5 | **RLS Supabase:** Revisar políticas de todas las tablas (profiles, packages, leads, payments, providers, specialists, experiences, bookings). Solo admin puede escribir en datos sensibles; público solo SELECT donde corresponda. | Backend | [x] |

---

## 2. Validación y tipos (Backend)

| # | Tarea | Responsable | Hecho |
|---|--------|-------------|-------|
| V1 | **Leads API:** Request body validado con Zod (LeadCreateSchema). Revisar que todos los campos opcionales/requeridos estén bien definidos y que no se acepten campos extra peligrosos. | Backend | [x] |
| V2 | **IDs en URLs:** Rutas que usan `[id]` (admin/leads/[id], etc.): validar que el id es UUID antes de consultar Supabase; ya existe test para admin API. Extender si hay más rutas dinámicas. | Backend | [x] |
| V3 | **Tipos TypeScript:** Revisar que lib/* (packages, experiences, providers, specialists) exporten tipos alineados con el esquema de Supabase. Opcional: generar tipos con `supabase gen types`. | Backend | [ ] |

---

## 3. Tests (Backend / QA)

| # | Tarea | Responsable | Hecho |
|---|--------|-------------|-------|
| T1 | **Cobertura:** Listar rutas API y páginas críticas; identificar las que no tienen test. Prioridad: /api/leads, /api/stripe/webhook (mock), /api/health. | QA/Backend | [ ] |
| T2 | **Tests E2E:** Valorar añadir un test E2E mínimo (Playwright o Cypress) para flujo assessment → thank-you. Documentar en README si se añade. | QA | [ ] |
| T3 | **Tests de integración:** Si hay tests que llaman a Supabase real, documentar si se usa .env.test o mocks. Asegurar que verify no dependa de credenciales de prod. | Backend/QA | [ ] |

---

## 4. Frontend y UX (Frontend)

| # | Tarea | Responsable | Hecho |
|---|--------|-------------|-------|
| F1 | **Accesibilidad:** Revisar contraste, focus visible y labels en formularios (assessment, signin). Corregir si hay fallos evidentes. | Frontend | [ ] |
| F2 | **Mensajes de error:** Revisar que los errores mostrados al usuario no revelen datos internos (stack, IDs de BD). Revisar AssessmentForm y signin. | Frontend | [ ] |
| F3 | **Loading y estados:** Confirmar que botones/forms tienen estado de carga donde aplique (evitar doble submit). | Frontend | [ ] |
| F4 | **SEO y meta:** Revisar metadata en layout y páginas principales (title, description, og). Ya documentado en NEXT_TASKS; verificar que esté aplicado. | Frontend | [ ] |

---

## 5. Infra y configuración (DevOps / Repo)

| # | Tarea | Responsable | Hecho |
|---|--------|-------------|-------|
| I1 | **Variables de entorno:** Comprobar que .env.example (o .env.local.example) lista todas las variables necesarias con comentarios. Documentar NEXT_PUBLIC_* vs server-only. | Repo/DevOps | [ ] |
| I2 | **Migraciones:** Verificar que run_migrations.sh y documentación (README) explican bien link + db push y que no queden migraciones sin aplicar en remoto. | Repo | [ ] |
| I3 | **Build y CI:** Si hay GitHub Actions (o similar), asegurar que verify (lint + test + build) corre en cada PR. Si no hay CI, documentar "Ejecutar npm run verify antes de merge". | Repo/DevOps | [ ] |

---

## 6. Documentación y consistencia (Repo)

| # | Tarea | Responsable | Hecho |
|---|--------|-------------|-------|
| D1 | **README:** Comprobar que las secciones (scripts, env, deploy, cómo vender) están actualizadas y enlazan a docs correctos. | Repo | [ ] |
| D2 | **Modelo de datos:** Confirmar que docs/DATA_MODEL.md y CURATED_NETWORK_FOUNDATION.md reflejan el esquema actual (providers, specialists, approval_status, bookings). | Repo/Backend | [ ] |
| D3 | **TODOs y FIXMEs:** Buscar TODO/FIXME/HACK en app/, lib/, api/. Resolver o documentar en ISSUES/NEXT_TASKS. | Cualquiera | [x] |

---

## 7. Mejoras opcionales (post-auditoría)

| # | Tarea | Responsable | Hecho |
|---|--------|-------------|-------|
| M1 | **Logging:** Revisar si los logs (createLogger) incluyen solo datos seguros (sin PII en nivel info). Ajustar si hace falta. | Backend | [ ] |
| M2 | **Monitoreo:** Documentar opción de Sentry (o similar) para errores en producción. No implementar obligatorio; solo doc. | DevOps | [ ] |
| M3 | **Admin UI:** Listar pantallas admin (leads, assets, etc.) y comprobar que todas exigen requireAdmin. Añadir protección en rutas API admin si falta. | Backend/Frontend | [ ] |

---

## Cómo usar este documento

1. **Asignar:** Cada bloque (Seguridad, Validación, Tests, etc.) puede asignarse a un responsable (Backend, Frontend, QA, DevOps, Repo).
2. **Ejecutar:** Ir tarea por tarea; marcar [x] cuando se complete; añadir nota breve si algo se documenta en otro sitio.
3. **Cerrar:** Al terminar la auditoría, actualizar "Última actualización" y opcionalmente añadir un párrafo "Resultado auditoría: [resumen]" al final del doc o en STATUS.md.

---

## Resultado auditoría 2026-03-07

Auditoría de seguridad (S1–S5), validación (V1–V2) y TODOs (D3). Sin cambios en código.

- **Informe completo:** [docs/AUDITORIA_RESULTADO.md](AUDITORIA_RESULTADO.md)
- **Resumen:** API solo 2 rutas (leads pública + rate limit, webhook por firma). Sin secrets en código. Firma Stripe validada antes de procesar. RLS revisado en migraciones 0006–0009 (specialists, experiences, consultations, providers, bookings); profiles/leads/packages/payments no definidos en migraciones del repo. Leads con Zod; admin/leads/[id] no valida UUID (recomendado usar RouteIdParamSchema). Sin TODO/FIXME/HACK en app/, lib/, api/.

---

## Referencias

- [AGENTS.md](../AGENTS.md) — Reglas para agentes.
- [docs/NEXT_TASKS.md](NEXT_TASKS.md) — Tareas prioritarias del plan.
- [docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md) — Fases y briefings.
- [docs/DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — Checklist de deploy.
