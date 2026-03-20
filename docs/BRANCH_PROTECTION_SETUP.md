# Branch Protection Setup (GitHub) — Copy/Paste Runbook

Guía para proteger ramas en GitHub. **Guía maestra:** [GITHUB_ENTERPRISE_SETUP.md](GITHUB_ENTERPRISE_SETUP.md).

**Estrategia de ramas (resumen en español):** [ESTRATEGIA_RAMAS_GITHUB.md](ESTRATEGIA_RAMAS_GITHUB.md).

## Modo simple (solo `main`) — recomendado para SaaS con un solo deploy

Si solo usas la rama `main` y un proyecto Vercel:

1. **Settings** → **Branches** → **Add rule** → Branch name: `main`.
2. Activar (política mínima recomendada):
   - **Require a pull request before merging**
   - **Require approvals**: al menos **1**
   - **Require status checks to pass before merging**
     - Required checks:
       - `CI / lint-and-build`  (equivale a `npm run verify` en CI)
       - `security / secret-scan` (TruffleHog secrets scan)
   - **Require branches to be up to date before merging**
   - **Restrict who can push to matching branches** (si tu plan lo permite)
   - **Do not allow bypassing the above settings**
3. Guardar. Con esto nadie puede mergear a `main` sin PR, sin review y sin CI (verify + security) en verde.

El resto de ramas (`feature/*`, `hotfix/*`) no necesitan protección; el merge siempre será a `main` por PR.

---

## Modo completo (dev → staging → main)

Use this runbook to enforce the full workflow (`dev` -> `staging` -> `main`) in GitHub.

## Prerequisites

- Branches already exist in origin:
  - `main`
  - `staging`
  - `dev`
- CI workflow name is `CI`.

## 1) Protect `main` (Production)

In GitHub:

1. Repository -> **Settings** -> **Branches** -> **Add branch protection rule**
2. Branch name pattern: `main`
3. Enable:
   - **Require a pull request before merging**
   - **Require approvals** (recommended: 1+)
   - **Dismiss stale pull request approvals when new commits are pushed**
   - **Require status checks to pass before merging**
   - Required checks: `CI / lint-and-build`
   - **Require branches to be up to date before merging**
   - **Restrict who can push to matching branches** (if your org plan supports it)
   - **Do not allow bypassing the above settings**
4. Save.

## 2) Protect `staging` (Pre-production)

Create a second rule:

- Branch pattern: `staging`
- Enable:
  - PR required
  - Required status checks (`CI / lint-and-build`)
  - Require branch up to date before merge
  - Restrict direct pushes (recommended)

## 3) Protect `dev` (Integration)

Create a third rule:

- Branch pattern: `dev`
- Recommended:
  - PR required (or at least PR preferred by team policy)
  - Required checks (`CI / lint-and-build`) if team wants strict integration quality
  - Allow maintainers to merge quickly when needed

## 4) Optional rules for short-lived branches

- `feature/*`: no protection needed (CI runs on push and PR).
- `hotfix/*`: no protection needed, but enforce PR to `main`.

## 5) Verify protection works

Run these checks with a test PR:

1. Open PR to `dev` from `feature/test-branch-protection`.
2. Confirm CI runs automatically.
3. Try to merge before CI green -> must be blocked.
4. Repeat for `staging` and `main`.

## 6) Team operating rules (enforced by protection)

- No direct push to `main`.
- Release flow:
  - `feature/*` -> `dev`
  - `dev` -> `staging`
  - `staging` -> `main`
- Hotfix flow:
  - `hotfix/*` from `main`, then back-merge to `staging` and `dev`.
