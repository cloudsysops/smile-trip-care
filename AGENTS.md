# Agentes — Nebula Smile

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

## Referencias rápidas

- [ESTRATEGIA_RAMAS_GITHUB](docs/ESTRATEGIA_RAMAS_GITHUB.md) — Ramas: main, feature/*, hotfix/*; flujo ordenado y protección en GitHub.
- [DEPLOY_CHECKLIST](docs/DEPLOY_CHECKLIST.md)
- [TEST_FIRST_SALE](docs/TEST_FIRST_SALE.md)
- [ENV_Y_STRIPE](docs/ENV_Y_STRIPE.md)
- [STATUS](STATUS.md)
