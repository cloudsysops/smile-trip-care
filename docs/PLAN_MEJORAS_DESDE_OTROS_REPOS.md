# Auditoría de otros repositorios y plan de mejoras para Smile

**Objetivo:** Tras auditar los repos del workspace (nuevo-repo como referencia, empresas como archivo), definir **qué agregar** a `smile-transformation-platform` sin duplicar ni cambiar el producto como fuente de verdad.

**Referencia:** En la raíz del workspace de proyectos (`proyectos/`) está `PROYECTOS_MASTER_MAP.md` — Smile = producto canónico; nuevo-repo = referencia.

**Documentos ya creados (Fase 1):** [STRIPE_WEBHOOKS_ENVIRONMENTS.md](STRIPE_WEBHOOKS_ENVIRONMENTS.md), [GO_LIVE_CHECKLIST.md](GO_LIVE_CHECKLIST.md), [ARCHITECTURE.md](ARCHITECTURE.md). SECURITY.md existe en la raíz del repo (actualizar contacto cuando corresponda).

---

## 1. Auditoría de los otros repositorios

### 1.1 nuevo-repo (EMPRESAS Platform — referencia)

| Área | Qué tiene | Relevancia para Smile |
|------|-----------|------------------------|
| **CI/CD** | Muchos workflows: security.yml (TruffleHog, Snyk, Trivy), ci-main, quality, deploy, rotate-secrets, monorepo-guard, etc. | No copiar todo; sí **una versión ligera** de security (secret scan o dependency scan). |
| **Calidad de commits** | commitlint (conventional), .husky (pre-commit, commit-msg), lint-staged (ESLint + Prettier por staged) | **Copiar y adaptar** a npm: commits convencionales y pre-commit lint. |
| **Docs operativos** | GO_LIVE_CHECKLIST.md, DEPLOYMENT.md, RUNBOOK-style, WEBHOOKS.md (Stripe por ambiente) | **Adaptar** a Smile: go-live y webhooks por env (dev/staging/prod). |
| **Monitoreo** | CHECKLIST_MONITORING.md, SLOs, Prometheus/Grafana, Blackbox, rotación de secretos | Para más adelante; **por ahora** solo ideas en doc (Sentry primero). |
| **Estructura** | Monorepo (apps + packages), Docker, k8s, Makefile | **No** migrar; Smile sigue siendo un solo Next.js app. |
| **Apps** | wellness-tourism, api-gateway, mobile, auth-system, etc. | Solo referencia de patrones; **no** unificar código. |

**Conclusión:** De nuevo-repo nos interesa **commitlint + lint-staged + husky** (opcional), **un workflow de seguridad simplificado**, y **documentación** (go-live, webhooks multi-ambiente).

### 1.2 empresas/

- Solo carpeta `logs/` (LaunchAgent). **No** es producto ni referencia de código.
- **Acción:** Tratarlo como archivo; no agregar nada a Smile desde aquí.

### 1.3 scripts/ (raíz proyectos)

- Herramientas de estación Mac (setup, CLIs, Tailscale, etc.).
- **Acción:** Usar como está; Smile ya referencia verify/env_check propios. Opcional: en docs de Smile mencionar que existe `scripts/` para la máquina.

---

## 2. Plan: qué agregar a nuestro proyecto (Smile)

Todo lo que se agregue debe **mantener** a Smile como único producto: un solo repo Next.js, sin monorepo ni lógica duplicada desde nuevo-repo.

---

### Fase 1 — Documentación y runbooks (SAFE)

| # | Qué agregar | Origen | Dónde en Smile |
|---|-------------|--------|-----------------|
| 1.1 | **Guía Stripe webhooks por ambiente** | nuevo-repo `docs/WEBHOOKS.md` | Crear o ampliar `docs/ENV_Y_STRIPE.md` (o `docs/WEBHOOKS_STRIPE.md`): dev (Stripe CLI + forward URL), staging, prod; nunca subir secretos. |
| 1.2 | **Go-live checklist** (versión corta) | nuevo-repo `GO_LIVE_CHECKLIST.md` | Crear `docs/GO_LIVE_CHECKLIST.md` adaptado a Smile: verify, deploy_verify, webhook 200, primera venta E2E, SECURITY.md, env en Vercel. Enlazar desde DEPLOY_CHECKLIST. |
| 1.3 | **Nota “producto canónico”** | Master Map | En README o en `docs/PLAN_AGENTES_PRODUCCION_Y_MEJORAS.md`: “Este repo es el producto canónico (MedVoyage Smile). Otros repos son referencia o soporte (ver PROYECTOS_MASTER_MAP en la raíz de proyectos).” |

**Criterios de aceptación:** Docs existen, son claros y enlazados desde NEXT_TASKS o DEPLOY_CHECKLIST.

---

### Fase 2 — Calidad de commits y pre-commit (SAFE / MODERATE)

| # | Qué agregar | Origen | Cómo en Smile |
|---|-------------|--------|----------------|
| 2.1 | **Commitlint** (conventional commits) | nuevo-repo `commitlint.config.js` | Añadir `@commitlint/cli` + `@commitlint/config-conventional` (devDependencies). Config con tipos: feat, fix, docs, style, refactor, perf, test, chore, ci, build. |
| 2.2 | **Husky + commit-msg** | nuevo-repo `.husky/commit-msg` | Husky en devDependencies; hook `commit-msg` que ejecute `commitlint`. |
| 2.3 | **lint-staged** (solo lint, sin Prettier si no lo usáis) | nuevo-repo `.lintstagedrc.js` | Adaptar a **npm**: `lint-staged` en devDeps; en `.lintstagedrc.*` solo `eslint --fix` para `*.{ts,tsx,js,jsx}`. Opcional: Prettier si ya está en el proyecto. |
| 2.4 | **Husky pre-commit** | nuevo-repo `.husky/pre-commit` | Ejecutar `npx lint-staged` en pre-commit. |

**Criterios de aceptación:** Al hacer commit, se valida el mensaje (commitlint) y se ejecuta lint sobre archivos staged; `npm run verify` sigue pasando.

**Riesgo:** MODERATE si nunca habéis usado Husky (puede romper commits en máquinas sin deps). Opcional: hacer Fase 2 solo cuando el equipo esté de acuerdo.

---

### Fase 3 — Seguridad en CI (MODERATE)

| # | Qué agregar | Origen | Cómo en Smile |
|---|-------------|--------|----------------|
| 3.1 | **Secret scan en CI** | nuevo-repo `security.yml` (TruffleHog) | Añadir **un** job en `.github/workflows/ci.yml` (o workflow separado `security.yml`) que ejecute TruffleHog contra el repo (sin Snyk/Trivy para no complicar). Ejemplo: `trufflesecurity/trufflehog@main` con `path: ./`, opcional `base: main`. |
| 3.2 | **Dependency audit en CI** | nuevo-repo (Snyk en security) | Opción A: seguir usando `npm audit` en un step de CI (si no está ya). Opción B: añadir un step `npm audit --audit-level=high` (falla el job si hay high/critical). Smile ya tiene env_check; esto es solo para deps. |

**Criterios de aceptación:** En cada push/PR a main (o a las ramas que defináis), se corre secret scan; opcionalmente npm audit estricto. No hace falta Snyk ni Trivy por ahora.

**Riesgo:** MODERATE (cambia CI); hacer en rama y probar antes de main.

---

### Fase 4 — Mejora futura: event tracking

| # | Qué agregar | Descripción |
|---|-------------|-------------|
| 4.1 | **Tabla `events`** | Registrar eventos de funnel: `assessment_started`, `assessment_completed`, `proposal_viewed`, `whatsapp_clicked`, `deposit_paid`. Alimenta `/admin/analytics` con métricas de conversión reales (no solo agregados de leads). |
| 4.2 | **Inserción desde app** | En assessment, thank-you, botón WhatsApp, webhook Stripe: insertar fila en `events` (event_type, lead_id opcional, created_at). Sin cambiar flujo actual; solo añadir escritura. |

**Cuándo:** Después de go-live y Sentry; cuando quieras afinar conversion analytics. Ver también [ANALYTICS_DASHBOARD.md](ANALYTICS_DASHBOARD.md).

---

### Fase 5 — No agregar (por ahora)

| Qué | Motivo |
|-----|--------|
| Monorepo, Docker, k8s desde nuevo-repo | Smile es una app Next.js en Vercel; no migrar arquitectura. |
| Múltiples workflows de nuevo-repo (matrix, deploy, rotate-secrets) | Mantener un CI simple (lint + test + env + build); solo añadir seguridad ligera. |
| JWT / auth de nuevo-repo | Auth canónica es Smile (Supabase + roles). |
| Packages compartidos (@empresas/ui, etc.) | Solo si más adelante decidís monorepo o lib compartida. |
| Prometheus/Grafana/SLOs/CHECKLIST_MONITORING | Después de Sentry y go-live; documentar como “futuro” si queréis. |

---

## Implementado (resumen)

- **Fase 1:** `docs/STRIPE_WEBHOOKS_ENVIRONMENTS.md`, `docs/GO_LIVE_CHECKLIST.md`, `docs/ARCHITECTURE.md`. `SECURITY.md` en la raíz (actualizar contacto cuando corresponda).
- **Fase 3:** `.github/workflows/security.yml` (TruffleHog). En `ci.yml`: step `npm audit --audit-level=high` con `continue-on-error: true` (quitar para exigir cero high).

---

## 3. Orden sugerido de implementación

1. **Fase 1 (solo docs)** — Sin tocar código; cierra brecha operativa y deja claro el rol de Smile.
2. **Fase 3 (security en CI)** — Un job de secret scan (y opcionalmente npm audit) mejora seguridad sin cambiar flujo local.
3. **Fase 2 (commitlint + lint-staged + husky)** — Cuando el equipo quiera commits convencionales y lint en pre-commit; puede ser opcional.

---

## 4. Resumen

- **Auditoría:** nuevo-repo = referencia (CI, commits, runbooks, webhooks); empresas = solo logs; scripts = soporte de máquina.
- **Qué agregar a Smile:**
  - **Fase 1:** Documentación (webhooks por ambiente, go-live checklist, nota de producto canónico).
  - **Fase 2 (opcional):** Commitlint + Husky + lint-staged para commits convencionales y lint pre-commit.
  - **Fase 3:** Secret scan (y opcional npm audit) en GitHub Actions.
- **Qué no agregar:** Monorepo, múltiples workflows complejos, auth/JWT de otro repo, stacks de monitoreo pesados hasta después de Sentry y go-live.

Así el producto sigue siendo único (Smile), con mejoras de calidad y seguridad inspiradas en el otro repositorio, sin duplicar lógica ni cambiar la arquitectura actual.
