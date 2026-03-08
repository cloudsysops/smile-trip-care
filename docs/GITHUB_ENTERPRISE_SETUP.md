# Configuración GitHub tipo Enterprise para SaaS

Guía para dejar el repositorio **Nebula Smile** organizado y seguro a nivel SaaS/empresa: protección de ramas, CI, plantillas, seguridad y buenas prácticas.

---

## 1. Resumen rápido

| Qué | Dónde / Cómo |
|-----|----------------|
| **Rama de producción** | `main` → despliega a Vercel (único proyecto -dev). [VERCEL_UN_SOLO_PROYECTO.md](VERCEL_UN_SOLO_PROYECTO.md) |
| **CI** | `.github/workflows/ci.yml`: lint + test + env_check + build en cada push y PR. |
| **Protección de ramas** | Configurar en GitHub → Settings → Branches. Ver §3. |
| **Plantillas** | PR: `.github/PULL_REQUEST_TEMPLATE.md`. Issues: `.github/ISSUE_TEMPLATE/`. |
| **Seguridad** | `SECURITY.md`, `CONTRIBUTING.md`, Dependabot (`.github/dependabot.yml`). |
| **Flujo** | [GIT_WORKFLOW.md](GIT_WORKFLOW.md). Protección: [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md). |

---

## 2. Dos modos de operación

### Modo simple (recomendado para empezar)

- **Una rama protegida:** `main`.
- Todo el trabajo en ramas `feature/*` (o `hotfix/*`); merge a `main` solo por **Pull Request** con **CI en verde**.
- Un solo entorno de deploy (Vercel -dev). Ideal para equipo pequeño o MVP.

### Modo completo (dev → staging → main)

- Tres ramas: `dev`, `staging`, `main`.
- Flujo: `feature/*` → `dev` → `staging` → `main`.
- Útil cuando tengas staging/preview distinto de producción. Ver [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md) y [GIT_WORKFLOW.md](GIT_WORKFLOW.md).

En ambos casos, **nunca** push directo a `main`; siempre PR + CI + (opcional) review.

---

## 3. Configuración en GitHub (pasos)

### 3.1 General (Settings → General)

- **Repository name:** Mantener o renombrar (ej. `smile-transformation-platform`).
- **Description:** Breve descripción del producto (ej. "Health & tourism coordination — Medellín & Manizales").
- **Visibility:** Private (recomendado para SaaS) o Public según política.
- **Features:** Marcar **Issues**, **Pull requests**, **Preserve this repository** si quieres evitar borrados accidentales.
- **Pull Requests:** Opcionalmente desmarcar "Allow merge commits" y usar "Squash and merge" o "Rebase and merge" para historial más limpio.

### 3.2 Branch protection para `main` (obligatorio)

1. **Settings** → **Branches** → **Add branch protection rule** (o editar la de `main`).
2. **Branch name pattern:** `main`.
3. Activar:
   - **Require a pull request before merging**
     - Require approvals: **1** (o más si el equipo lo define).
     - Dismiss stale pull request approvals when new commits are pushed: **activado**.
   - **Require status checks to pass before merging**
     - Buscar y marcar: **lint-and-build** (nombre del job en `.github/workflows/ci.yml`).
   - **Require branches to be up to date before merging** (recomendado).
   - **Do not allow bypassing the above settings** (si tu plan lo permite).
4. Opcional: **Restrict who can push to matching branches** → solo personas/teams que deban poder mergear a producción.
5. **Create** / **Save changes**.

Con esto, nadie puede hacer merge a `main` sin un PR y sin que el CI pase.

### 3.3 Protección para `staging` y `dev` (si usas modo completo)

- Crear reglas adicionales para `staging` y `dev` con los mismos status checks (`lint-and-build`) y "Require pull request". Ver [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md).

### 3.4 Secrets y variables

- **Settings** → **Secrets and variables** → **Actions**  
  Usar solo si en el futuro tienes jobs que necesiten secretos (ej. deploy desde GitHub Actions). Hoy el deploy lo hace Vercel con sus propios secrets.
- **No** subir nunca API keys ni contraseñas al repo; todo en Vercel / Supabase y en `.env.local` (local, no commiteado).

### 3.5 Environments (opcional)

- **Settings** → **Environments**  
  Puedes crear `production` y `staging` si usas GitHub Actions para deploy y quieres approval gates o secrets por entorno. Con deploy solo en Vercel, no es estrictamente necesario.

### 3.6 Teams y permisos (organización)

- Si el repo está bajo una **Organization**:
  - **Settings** → **Collaborators and teams** (o en la org: People → Teams).
  - Crear equipos si aplica (ej. "Developers", "Admins").
  - Asignar permisos al repo: **Write** para quien hace PR y merge; **Admin** para quien gestiona settings y protección.
  - Opcional: **CODEOWNERS** (`.github/CODEOWNERS`) para que ciertos paths requieran review de personas concretas.

---

## 4. Archivos que ya tienes en el repo

| Archivo | Uso |
|---------|-----|
| `.github/workflows/ci.yml` | CI: lint, test, env_check, build en push y PR. Job `lint-and-build` para branch protection. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Plantilla al abrir un PR. |
| `.github/ISSUE_TEMPLATE/*.md` | Plantillas para Bug y Feature. |
| `.github/dependabot.yml` | Actualizaciones semanales de npm y GitHub Actions. |
| `SECURITY.md` | Cómo reportar vulnerabilidades. |
| `CONTRIBUTING.md` | Cómo contribuir (ramas, verify, PR). |
| `docs/BRANCH_PROTECTION_SETUP.md` | Detalle de reglas para main/staging/dev. |
| `docs/GIT_WORKFLOW.md` | Flujo de ramas y merge. |

---

## 5. Checklist de configuración (tú haces en GitHub)

- [ ] Branch protection en `main`: PR requerido, status check `lint-and-build`, branch up to date.
- [ ] (Opcional) Aprobaciones: 1 o más según equipo.
- [ ] (Opcional) Restringir quién puede push/merge a `main`.
- [ ] Descripción y visibilidad del repo revisadas.
- [ ] Política de merge (Squash/Rebase) elegida en Settings → Pull Requests.
- [ ] Si usas org: equipos y permisos definidos.
- [ ] SECURITY.md: sustituir "[indicar email...]" por email real de contacto de seguridad.

---

## 6. Labels recomendados (opcional)

En **Issues** → **Labels** puedes crear, por ejemplo:

- `bug` — fallos.
- `enhancement` — mejoras / features.
- `dependencies` — Dependabot.
- `documentation` — solo docs.
- `priority: high` / `priority: low` — prioridad.
- `module: landing` / `module: admin` / `module: api` — área del producto.

Las plantillas de issues ya proponen `bug` y `enhancement`.

---

## 7. Resumen

- **Repo listo para SaaS:** CI en cada PR, plantillas de PR e issues, seguridad y contribución documentadas, Dependabot activo.
- **Tu parte en GitHub:** Configurar **branch protection** en `main` (y opcionalmente staging/dev), revisar permisos y, si quieres, labels y CODEOWNERS.
- **Referencias:** [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md), [GIT_WORKFLOW.md](GIT_WORKFLOW.md), [CONTRIBUTING.md](../CONTRIBUTING.md), [SECURITY.md](../SECURITY.md).

Si más adelante añades staging o un segundo entorno en Vercel, basta con replicar la protección en esas ramas y actualizar esta guía.
