# Estrategia de ramas en GitHub — Nebula Smile

Guía para trabajar ordenado: qué ramas usar, cómo nombrarlas y cómo configurar GitHub.

**Resumen:** Todo cambio de código va en una rama (nunca directo a `main`). Se integra por **Pull Request** con CI en verde. Producción se despliega desde `main`.

---

## Dos modos (elige uno)

### Opción A — Modo simple (recomendado para equipo pequeño / un solo deploy)

| Rama        | Uso                          | Deploy              |
|------------|------------------------------|---------------------|
| `main`     | Código estable de producción | Vercel Production   |
| `feature/*`| Trabajo nuevo (features, fixes) | Preview por PR   |
| `hotfix/*` | Arreglo urgente de producción | PR a `main`     |

**Flujo:** `feature/nombre` → PR a `main` → merge → Vercel despliega desde `main`.

- No hace falta crear `dev` ni `staging` si solo tienes un proyecto en Vercel.
- Ver [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md) § "Modo simple".

### Opción B — Modo completo (dev → staging → main)

| Rama        | Uso                          | Deploy              |
|------------|------------------------------|---------------------|
| `main`     | Producción estable            | Vercel Production   |
| `staging`  | Validación pre-lanzamiento   | Staging (si configuras) |
| `dev`      | Integración diaria            | Preview / Dev       |
| `feature/*`| Trabajo por feature           | Preview por PR      |
| `hotfix/*` | Arreglo urgente              | PR a `main`         |

**Flujo:** `feature/*` → `dev` → `staging` → `main`. Ver [GIT_WORKFLOW.md](GIT_WORKFLOW.md) y [RELEASE_FLOW.md](RELEASE_FLOW.md).

---

## Nomenclatura de ramas

- **Features / mejoras:** `feature/<alcance-corto>`  
  Ejemplos: `feature/assessment-phone`, `feature/admin-export`, `feature/landing-cta`
- **Hotfixes (urgentes):** `hotfix/<ticket-o-descripcion>`  
  Ejemplos: `hotfix/checkout-amount`, `hotfix/webhook-500`
- **No usar:** `main` como rama de trabajo; no hacer push directo a `main`.

El CI ya está configurado para `main`, `staging`, `dev`, `feature/**`, `hotfix/**` (`.github/workflows/ci.yml`).

---

## Flujo de trabajo día a día (modo simple)

### 1. Empezar una tarea nueva

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b feature/nombre-descriptivo
```

### 2. Trabajar y commitear

```bash
# tras cambios
git add .
git status
git commit -m "feat: descripción breve"
git push -u origin feature/nombre-descriptivo
```

### 3. Integrar en main (Pull Request)

1. En GitHub: **Compare & pull request** (rama `feature/...` → `main`).
2. O por CLI: `gh pr create --base main --head feature/nombre-descriptivo`
3. Esperar a que el CI pase (lint, test, build).
4. Revisar y hacer **Merge**.
5. Opcional: borrar la rama `feature/...` tras el merge.

### 4. Hotfix urgente

```bash
git checkout main
git pull --ff-only origin main
git checkout -b hotfix/descripcion
# hacer el fix, commit, push
git push -u origin hotfix/descripcion
```

Luego: PR de `hotfix/...` → `main`. Tras merge, el fix ya está en producción (Vercel despliega desde `main`).

---

## Configuración en GitHub (una sola vez)

### 1. Proteger `main`

1. Repo → **Settings** → **Branches** → **Add branch protection rule** (o editar la de `main`).
2. **Branch name pattern:** `main`.
3. Activar:
   - **Require a pull request before merging**
   - **Require status checks to pass** → elegir el check **`lint-and-build`** (nombre del job en CI).
   - **Require branches to be up to date before merging**
   - **Do not allow bypassing the above settings**
4. Guardar.

Con esto nadie puede mergear a `main` sin PR y sin que el CI pase.

### 2. (Opcional) Crear ramas permanentes `dev` y `staging` (modo completo)

Solo si eliges Opción B:

```bash
git checkout main
git pull --ff-only origin main
git checkout -b dev
git push -u origin dev
git checkout main
git checkout -b staging
git push -u origin staging
git checkout main
```

Luego en GitHub añade reglas de protección para `staging` y `dev` según [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md) § "Modo completo".

---

## Resumen rápido

| Pregunta | Respuesta |
|----------|-----------|
| ¿Dónde está el código de producción? | Rama `main`. |
| ¿Dónde trabajo una feature? | Rama `feature/nombre`. |
| ¿Cómo subo mi trabajo a producción? | PR de `feature/...` a `main`; merge cuando CI esté en verde. |
| ¿Arreglo urgente en producción? | Rama `hotfix/nombre` desde `main`; PR a `main`. |
| ¿Push directo a `main`? | No; siempre por PR y con CI en verde. |

---

## Referencias

- [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md) — Reglas exactas en GitHub (modo simple y completo).
- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) — Flujo detallado en inglés (modo completo).
- [RELEASE_FLOW.md](RELEASE_FLOW.md) — Ciclo dev → staging → main.
- [GITHUB_ENTERPRISE_SETUP.md](GITHUB_ENTERPRISE_SETUP.md) — Setup general del repo y CI.
