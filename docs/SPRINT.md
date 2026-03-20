# Sprint process — Nebula Smile

Proceso de sprint profesional: planificación, ejecución y cierre.

---

## Cadencia

- **Duración:** 2 semanas (10 días laborables).
- **Opcional:** 1 semana para sprints de enfoque único (ej. solo Deploy).

---

## Ceremonias

| Ceremonia | Cuándo | Duración | Objetivo |
|-----------|--------|----------|----------|
| **Sprint Planning** | Día 1, inicio | 30–60 min | Objetivo del sprint, backlog comprometido, criterios de aceptación. |
| **Daily** (opcional) | Cada día | 5–15 min | Qué hice / qué haré / bloqueos. |
| **Sprint Review** | Último día | 30 min | Demostrar lo hecho; feedback. |
| **Sprint Retro** | Tras el Review | 15–30 min | Qué mejorar (proceso, herramientas). |
| **Sprint Ceremony (cierre)** | Tras Retro | — | Merge a `main`, deploy, actualizar STATUS. |

---

## Definition of Done (por ítem)

Un ítem está **Done** cuando:

- [ ] Código en rama (feature/sprint), revisado o self-review.
- [ ] `./scripts/verify_all.sh` pasa (lint + test + build).
- [ ] Comportamiento verificado según criterios de aceptación.
- [ ] Documentación actualizada si aplica (README, STATUS, docs).
- [ ] Sin secretos ni credenciales en el repo.

---

## Flujo por sprint

### Inicio de sprint

```bash
./scripts/sprint-start.sh
```

- Comprueba estado del repo y que `verify_all` pase.
- Opcional: crea rama `sprint/YYYY-MM-DD` o `feature/nombre`.
- Muestra objetivo del sprint y ítems comprometidos.

### Durante el sprint

- Trabajar en ramas cortas; integrar a la rama del sprint o a `main` vía PR.
- Ejecutar `./scripts/verify_all.sh` antes de cada push/PR.
- Actualizar STATUS.md y docs cuando se complete un módulo.

### Cierre de sprint

```bash
./scripts/sprint-end.sh
```

- Vuelve a ejecutar `verify_all`.
- Muestra checklist de PR y deploy.
- Recordatorio: merge a `main`, verificar CI y smoke en prod si aplica.

---

## Sprint actual: Deploy & production verification

**Objetivo:** Dejar la app desplegada en producción, con Stripe y webhook verificados, lista para vender.

**Backlog comprometido:**

| Ítem | Responsable | DoD |
|------|-------------|-----|
| Vercel: repo conectado, env configurados, deploy desde `main` | — | [docs/DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) §1 |
| Stripe: webhook prod, signing secret en Vercel, test 200 | — | §2 |
| Smoke: health, assessment → lead → depósito → webhook → DB | — | §3 |
| (Opcional) Dominio custom y SSL | — | [PRODUCCIÓN_CHECKLIST.md](PRODUCCIÓN_CHECKLIST.md) |

**Referencias:**

- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) — Pasos concretos deploy.
- [PRODUCCIÓN_CHECKLIST.md](PRODUCCIÓN_CHECKLIST.md) — Checklist ampliado para vender.
- [DEV_QA_PROD.md](DEV_QA_PROD.md) — Entornos (local Docker, QA, prod).

---

## Historial de sprints (resumen)

| Sprint | Fechas | Objetivo | Estado |
|--------|--------|----------|--------|
| Startup (M1–M9) | — | Foundation, DB, Landing, Admin, Stripe, AI | ✅ Done |
| **Deploy & prod** | Actual | Vercel + Stripe webhook + smoke en prod | ⏳ En curso |

**Plan ejecutable:** [PLAN_TRABAJO_PRODUCCION.md](PLAN_TRABAJO_PRODUCCION.md) — tareas por agente. Briefings: [TAREAS_AGENTES_BRIEFINGS.md](TAREAS_AGENTES_BRIEFINGS.md).

Cuando se cierre el sprint Deploy, añadir aquí una línea “Done” y el siguiente sprint (ej. “Growth” o “Iteración post-lanzamiento”).
