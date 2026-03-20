# Organización y mejora continua

**Objetivo:** Tener el proyecto ordenado, limpio y en mejora constante sin añadir complejidad innecesaria.

**Alineación 2026-03-08:** STATUS.md, README, PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md y NEXT_TASKS están actualizados con: módulos marketplace/curated network, Admin Overview, auditoría, migraciones 0006–0009, rutas públicas y admin.

---

## ¿Necesitamos más agentes (roles)?

**Resumen:** Los roles actuales **siguen siendo suficientes**. Opcionalmente se puede añadir uno más para priorización y calidad.

| Rol actual | Uso |
|------------|-----|
| **Backend** | APIs, validación, RLS, Supabase, Stripe. |
| **Frontend** | UI, accesibilidad, formularios, dashboards. |
| **QA** | Tests, flujos E2E, verificación primera venta. |
| **DevOps** | Env, Vercel, Supabase, migraciones, dominio. |
| **Repo/CI** | Verify, docs, checklists, STATUS, NEXT_TASKS. |
| **Cualquiera** | Tareas que no requieren especialidad. |

**Opcional — un rol más:**

- **Product / Coordinación** (o "Tech Lead"): priorizar backlog, decidir qué entra en el siguiente sprint, revisar que NEXT_TASKS y PLAN_AGENTES estén alineados. No es obligatorio; puede hacerlo un humano o el mismo agente que hace Repo/CI.

**Recomendación:** No multiplicar roles. Mejor **definir bien responsabilidades** y un **ritmo claro** (ver abajo).

---

## Lo que sí conviene: estructura y ritmo

Para mantener el proyecto **organizado, limpio y en mejora continua** sin crecer en caos:

### 1. Una sola lista maestra

- **Fuente de verdad:** [docs/NEXT_TASKS.md](NEXT_TASKS.md) para tareas concretas "qué hacer ahora".
- **Plan por fases:** [docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md](PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md) para Fase 0, 1, 2 y backlog.
- **Auditoría:** [docs/TAREAS_AUDITORIA_BUENAS_PRACTICAS.md](TAREAS_AUDITORIA_BUENAS_PRACTICAS.md) para revisión de buenas prácticas (seguridad, tests, docs).
- **Dashboards y producto:** [docs/DASHBOARDS_POR_ROL.md](DASHBOARDS_POR_ROL.md), [docs/DATA_MODEL.md](DATA_MODEL.md).

Cualquier agente que añada tareas nuevas: ponerlas en NEXT_TASKS o en el Plan (Fase 2), no en documentos dispersos.

### 2. Cadencia de mejora continua

| Cadencia | Acción | Responsable |
|----------|--------|-------------|
| **Cada sesión de agente** | Ejecutar `npm run verify` antes de cerrar. Marcar en NEXT_TASKS la tarea completada. | Cualquier agente |
| **Cada sprint o cada N tareas** | Revisar si hay TODOs/FIXMEs nuevos; pasar una pasada de lint y tests. Opcional: marcar 1–2 ítems de auditoría (TAREAS_AUDITORIA). | Repo/CI o Backend |
| **Trimestral o pre-lanzamiento** | Auditoría completa (seguridad, RLS, validación, frontend, docs). Actualizar AUDITORIA_RESULTADO y STATUS. | Asignar por PLAN_AGENTES |

### 3. Reglas de “dejar limpio”

Al terminar cualquier tarea:

1. **Código:** Sin console.log de depuración, sin comentarios TODO sin ticket o referencia en NEXT_TASKS.
2. **Docs:** Si se tocó modelo de datos o flujos, actualizar DATA_MODEL o el doc correspondiente.
3. **Listas:** Marcar [x] en NEXT_TASKS o en el Plan; si la tarea salió de un briefing, indicarlo en el doc.
4. **Verify:** `npm run verify` en verde antes de dar por cerrada la tarea.

### 4. Qué no hacer (evitar desorden)

- No crear nuevos documentos de “tareas” sin enlazarlos desde NEXT_TASKS o del Plan.
- No añadir más roles de agente a menos que haya un flujo concreto (ej. “solo el agente X puede priorizar backlog”).
- No dejar migraciones sin aplicar en remoto; documentar en README o run_migrations.sh cómo aplicarlas.

---

## Resumen: ¿necesitamos más?

| Pregunta | Respuesta |
|----------|-----------|
| **¿Más agentes (roles)?** | No hace falta. Opcional: 1 rol de coordinación/priorización si quieren que alguien “cierre” sprints. |
| **¿Más estructura?** | Sí: una lista maestra (NEXT_TASKS + Plan), cadencia de auditoría y reglas de “dejar limpio”. |
| **¿Más documentación?** | No por cantidad. Sí mantener al día: STATUS, NEXT_TASKS, DATA_MODEL, resultado de auditoría. |
| **¿Mejora continua?** | Sí: verify en cada cierre, marcar tareas, y cada cierto tiempo pasar la auditoría y el backlog de Fase 2. |

Con esto el proyecto queda **organizado, bien estructurado, limpio y en mejora continua** sin crecer en agentes ni en documentos sueltos. Si más adelante el equipo crece, se puede añadir el rol de coordinación y/o cadencia trimestral explícita en el Plan.
