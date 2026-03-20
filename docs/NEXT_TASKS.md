# Próximas tareas — No parar

**Instrucción para cualquier agente que abra este repo:** ejecuta la primera tarea de esta lista que corresponda a tu tipo (o cualquier tarea si no hay asignación). Cuando termines, márcala y sigue con la siguiente. **No parar.**

Última actualización: 2026-03-08. Proyecto alineado: STATUS.md (módulos marketplace, curated network, Admin Overview, auditoría), README (scripts, estructura de app, docs), PLAN_AGENTES (migraciones 0006–0010, overview), NEXT_TASKS. Sprint Salir a vender: S1–S10 marcados; verify + deploy_verify OK.

---

## Auditoría completa y plan de mejoras (Backend, Frontend, DevOps, Integración, Marketing, Branding)

**Documento:** [AUDIT_AND_IMPROVEMENT_PLAN.md](AUDIT_AND_IMPROVEMENT_PLAN.md) — Reporte de estado por área y plan priorizado en sprints (S1–S6). Usar junto con PLAN_MEJORAS_PRODUCCION_POR_SPRINT para ejecutar tareas.

---

## Plan de mejoras para producción (por sprint, asignable a agentes)

**Documento:** [PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md](PLAN_MEJORAS_PRODUCCION_POR_SPRINT.md)

Sprints: **1** (cierre lanzamiento + SECURITY.md + regla docs), **2** (rate limit signup/login + middleware por rol), **3** (persistir webhook events + doc email), **4** (Sentry, E2E opcional, doc RLS), **5** (forgot password, dominio, staging). Cada tarea tiene agente sugerido y columna Hecho [ ]. Ejecutar en orden S1 → S2 → S3 → S4 → S5.

---

## Dashboards por rol

**Documento:** [DASHBOARDS_POR_ROL.md](DASHBOARDS_POR_ROL.md) — Diseño de dashboards para **Admin**, **Especialista**, **Paciente/Cliente** y **Proveedor** (sidebar, overview, métricas, acciones). Incluye qué más considerar (notificaciones, reportes, mensajería, auditoría) y orden de implementación.

---

## Auditoría buenas prácticas (asignar y ejecutar)

**Documento:** [TAREAS_AUDITORIA_BUENAS_PRACTICAS.md](TAREAS_AUDITORIA_BUENAS_PRACTICAS.md)

Tareas asignadas por área (Seguridad, Validación, Tests, Frontend, Infra, Documentación) para auditar el proyecto y asegurar cumplimiento de buenas prácticas. Ejecutar en orden; marcar [x] al completar.

---

## Ahora mismo (cualquier agente)

| # | Tarea | Quién | Hecho |
|---|--------|------|-------|
| 1 | Ejecutar `npm run verify`. Si falla, corregir hasta que pase. | Cualquiera | [x] |
| 2 | Ejecutar `./scripts/deploy_verify.sh https://smile-transformation-platform-dev.vercel.app`. Si falla, corregir. | Cualquiera | [x] |
| 3 | Revisar que no haya TODOs/FIXMEs sin resolver en `app/` y `lib/`. Documentar o resolver. (Revisado: ninguno en app/ ni lib/.) | Backend/Frontend | [x] |

---

## Fase 0 — Pre-producción

| # | Tarea | Quién | Hecho |
|---|--------|------|-------|
| 4 | Documentar en ENV_Y_STRIPE o README: "Añadir NEXT_PUBLIC_WHATSAPP_NUMBER en Vercel para el botón WhatsApp (solo dígitos, ej. 573001234567)". | DevOps | [x] |
| 5 | Añadir en .env.example la línea opcional: `# NEXT_PUBLIC_WHATSAPP_NUMBER=573001234567` con comentario. | Repo/CI | [x] |
| 6 | Verificar que todos los enlaces de la landing (Hero, Packages, Footer) llevan a rutas existentes. Ejecutar build y revisar. | Frontend | [x] |
| 7 | Añadir un test que verifique que GET /api/health devuelve 200 y body con ok: true. (Puede existir ya; si existe, asegurar que pasa.) | Backend | [x] |

---

## Fase 1 — Lanzamiento (requiere humano o agente con acceso)

*Pendientes: 8 y 9 requieren ejecución manual (Stripe Dashboard, flujo E2E). Cuando se completen, marcar 8, 9 y 10 y poner Deploy ✅ en STATUS.md.*

| # | Tarea | Quién | Hecho |
|---|--------|------|-------|
| 8 | **Humano:** Stripe Dashboard → Webhooks → Send test webhook (checkout.session.completed) → verificar 200. | Humano/DevOps | [ ] |
| 9 | **Humano:** Flujo completo: assessment → thank-you → signin → admin → Collect deposit → Stripe 4242 → Supabase. | Humano/QA | [ ] |
| 10 | Marcar DEPLOY_CHECKLIST y CHECKLIST_PRIMERA_VENTA con lo completado. Poner Deploy ✅ en STATUS.md. | QA/Repo | [ ] |

---

## Fase 2 — Mejoras (si Fase 0/1 está listo o en paralelo)

| # | Tarea | Quién | Hecho |
|---|--------|------|-------|
| 11 | Mensaje de error en /signin: si credenciales inválidas, mostrar "Invalid email or password" (sin revelar cuál). | Frontend | [x] |
| 12 | Meta tags en layout o landing: description, og:title, og:description para compartir. | Frontend | [x] |
| 13 | En README, sección "Cómo vender": 3–4 líneas (assessment → lead → admin → depósito → Stripe). Enlace a TEST_FIRST_SALE. | Repo/CI | [x] |
| 14 | Revisar app/api/leads/route.ts: rate limit y mensajes de error. Mejorar solo si hay algo claro sin romper contrato. | Backend | [x] |
| 15 | Añadir en docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md una línea "Estado: última ejecución de agentes: [fecha] — verify OK, deploy_verify OK." | Repo/CI | [x] |

---

## Sprint: Salir a vender — Página profesional

**Objetivo:** Dejar la página lista para vender con aspecto profesional. Ejecutar en orden. Doc completo: [SPRINT_SALIR_A_VENDER.md](SPRINT_SALIR_A_VENDER.md).

| # | Tarea | Quién | Hecho |
|---|--------|------|-------|
| S1 | Ejecutar `npm run verify`. Si falla, corregir. | Cualquiera | [x] |
| S2 | Ejecutar `./scripts/deploy_verify.sh https://smile-transformation-platform-dev.vercel.app`. Si falla, corregir. | Cualquiera | [x] |
| S3 | Revisar copy landing: títulos, barra superior, hero, FAQ, footer. Sin typos; tono profesional. | Frontend | [x] |
| S4 | Favicon: añadir `app/icon.png` o `public/favicon.ico`; si no hay asset, documentar en README. | Frontend/Repo | [x] |
| S5 | Footer: añadir columna "Legal" con enlace a `/legal` o "Privacy" (página mínima o #). | Frontend | [x] |
| S6 | Responsive: barra sticky no tapa contenido; CTAs tocables en móvil (~44px). | Frontend | [x] |
| S7 | Accesibilidad: contraste, focus visible en enlaces/botones, alt en imágenes. | Frontend | [x] |
| S8 | Barra superior (announcement): enlace visible; en móvil una o dos líneas. | Frontend | [x] |
| S9 | Ejecutar verify + deploy_verify de nuevo; marcar S1–S9 en NEXT_TASKS. | Repo/QA | [x] |
| S10 | STATUS.md: añadir línea "Sprint Salir a vender: checklist página profesional ejecutado (fecha)." | Repo | [x] |

---

## Reglas

- **Prioridad:** Ejecutar primero el **Sprint: Salir a vender** (S1–S10) para dejar la página profesional; luego Fase 1 (humano) y resto.
- **No parar.** Si tu tarea está hecha, toma la siguiente de esta lista o de PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md (Fase 2).
- Antes de cerrar: **npm run verify** debe pasar.
- No desplegar a producción sin documentar. Sí deploy a dev/preview.
- Actualiza este archivo: marca [x] cuando completes una tarea y opcionalmente añade "Última actualización: [fecha]" al inicio.
