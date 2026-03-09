# Agentes — MedVoyage Smile

**Si eres un agente (IA o humano) trabajando en este repo, lee esto primero.**

## Objetivo

Dejar la plataforma **lista para producción y vender**, con una **página profesional**, y mantenerla **siempre en mejoras**. No parar de trabajar: cuando termines tu asignación, toma la siguiente tarea del plan.

## Qué ejecutar ahora (prioridad)

1. **Sprint "Salir a vender":** [docs/SPRINT_SALIR_A_VENDER.md](docs/SPRINT_SALIR_A_VENDER.md) — checklist para dejar la página profesional y lista para vender. Ejecutar tareas S1–S10 en orden y marcar en [docs/NEXT_TASKS.md](docs/NEXT_TASKS.md) (sección "Sprint: Salir a vender").
2. **Lista general:** [docs/NEXT_TASKS.md](docs/NEXT_TASKS.md) — ejecuta la primera tarea que corresponda a tu tipo, márcala [x], y sigue. **No parar.**

## Plan de trabajo

**Documento maestro:** [docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md)

Ahí encontrarás:

- **Fase 0 — Pre-producción:** verify, env, migraciones, webhook, admin.
- **Fase 1 — Lanzamiento:** primera venta verificada, checklists cerrados, Deploy ✅.
- **Fase 2 — Mejoras continuas:** backlog priorizado (WhatsApp, Sentry, RLS, dominio, tests E2E, etc.).

Cada tarea está asignada a un tipo de agente (Repo/CI, Frontend, Backend, QA, DevOps) y tiene criterios de aceptación. Hay **briefings** listos para copiar y pegar al inicio de una sesión.

## Reglas

1. Ejecutar desde la **raíz del proyecto** (`smile-transformation-platform/`).
2. **Git:** Al conectar, sincronizar con el remoto (`git fetch` / `git pull`). Al terminar trabajo que modifica código o docs, **hacer commit** con mensaje claro y **push** a la rama actual. No dejar cambios sin commitear. Ver [.cursor/rules/git-commit-and-sync.mdc](.cursor/rules/git-commit-and-sync.mdc).
3. Antes de cerrar: **`npm run verify`** debe pasar (o documentar por qué no y qué falta).
3. No introducir nuevos frameworks; stack: Next.js 16, TypeScript, Supabase, Stripe, Vercel.
4. No desplegar a producción sin que esté documentado; sí se puede deploy a dev/preview.
5. Actualizar checklists y STATUS.md cuando corresponda (ver plan).

## Organización y mejora continua

- **[ORGANIZACION_Y_MEJORA_CONTINUA](docs/ORGANIZACION_Y_MEJORA_CONTINUA.md)** — ¿Necesitamos más agentes? Una lista maestra, cadencia de auditoría y reglas para dejar el repo limpio. Resumen: los roles actuales bastan; lo importante es estructura y ritmo.

## Auditoría y buenas prácticas

- **[TAREAS_AUDITORIA_BUENAS_PRACTICAS](docs/TAREAS_AUDITORIA_BUENAS_PRACTICAS.md)** — Tareas para auditar el proyecto (seguridad, validación, tests, frontend, infra, docs). Asignar por responsable y ejecutar; marcar al completar.

## Visión de producto y plan

- **[PRODUCT_VISION.md](docs/PRODUCT_VISION.md)** — Objetivo del producto: marketplace global de turismo médico (empezando por dental en Colombia). Pilares: assessment, AI matching, packages, patient portal, clinic marketplace, payments. Cursor y agentes deben alinear features y prioridades con esta visión.
- **[PLAN_12_MESES_ESCALADO.md](docs/PLAN_12_MESES_ESCALADO.md)** — Plan por fases: validación (0–3 meses), producto fuerte (3–6), marketplace (6–12). Objetivo: primeros 10–20 pacientes, luego automatización y expansión.
- **[GROWTH_STRATEGY_FIRST_100_PATIENTS.md](docs/GROWTH_STRATEGY_FIRST_100_PATIENTS.md)** — Estrategia para los primeros 100 pacientes: nicho inicial, SEO internacional, contenido, Google Ads, proceso de cierre humano, red de clínicas, automatización. Integrado con el flujo actual (landing → assessment → lead → admin → Stripe).
- **[PLAN_90_DIAS_PRIMEROS_100_PACIENTES.md](docs/PLAN_90_DIAS_PRIMEROS_100_PACIENTES.md)** — Plan operativo 90 días: ~2.000 leads → 100 pacientes. Fase 1 (día 1–30) landings + contenido + Ads; Fase 2 (30–60) contacto rápido + paquetes + testimonios; Fase 3 (60–90) más keywords, más países, referidos. Proyección: $140k con 100 pacientes.
- **[EXPANSION_GEOGRAFICA_MARKETPLACE.md](docs/EXPANSION_GEOGRAFICA_MARKETPLACE.md)** — Modelo de expansión por ciudades (hub Medellín + satélites) y países. Estructura de URLs (/cities/[city], /veneers-medellin), tabla `cities`, asociación providers→ciudades, paquetes por ciudad, matching ciudad/clínica/doctor. Orden de implementación: 1) cities en DB, 2) rutas /cities/[city], 3) páginas SEO por ciudad, 4) asociar clínicas a ciudades.

## Referencias rápidas

- [ESTRATEGIA_RAMAS_GITHUB](docs/ESTRATEGIA_RAMAS_GITHUB.md) — Ramas: main, feature/*, hotfix/*; flujo ordenado y protección en GitHub.
- [DEPLOY_CHECKLIST](docs/DEPLOY_CHECKLIST.md)
- [TEST_FIRST_SALE](docs/TEST_FIRST_SALE.md)
- [ENV_Y_STRIPE](docs/ENV_Y_STRIPE.md)
- [STATUS](STATUS.md)
