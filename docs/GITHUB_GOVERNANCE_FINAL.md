# GitHub Governance — MedVoyage Smile

**Objetivo:** Hacer que el workflow de ingeniería documentado sea **enforzable** vía GitHub, sin añadir burocracia innecesaria.

---

## 1. Resumen de la política final

- **Branch protegido:** `main`
- **PR obligatorio:** nadie mergea directo a `main`
- **Aprobaciones mínimas:** 1 review
- **Checks obligatorios:**
  - `CI / lint-and-build`  → corre `npm run verify` (lint + test + build + env_check)
  - `security / secret-scan` → TruffleHog para detectar secrets
- **Branch actualizado:** exigir que la rama esté up to date con `main` antes de merge
- **Push directo a `main`:** restringido (solo vía PR con checks en verde)

Esto alinea:

- `CONTRIBUTING.md` (verify antes del PR, reuse-first)
- `ENGINEERING_WORKFLOW.md` (verify, schema, E2E para flujos críticos)
- `QA_RELEASE_PLAYBOOK.md` (pre/post deploy)
- `docs/GIT_AND_GITHUB_WORKFLOW.md` y `docs/BRANCH_PROTECTION_SETUP.md`

---

## 2. Checks actuales en CI

### 2.1 Verify (CI)

Workflow: `.github/workflows/ci.yml`

- **Workflow name:** `CI`
- **Job:** `lint-and-build`
- Pasos principales:
  - `npm ci`
  - `npm audit --audit-level=high` (con `continue-on-error: true` por ahora)
  - `npm run lint`
  - `npm run test`
  - `./scripts/env_check.sh`
  - `npm run build`

En GitHub, el check se ve como:  
**`CI / lint-and-build`**

### 2.2 Security scan

Workflow: `.github/workflows/security.yml`

- **Workflow name:** `security`
- **Job:** `secret-scan`
- Usa `trufflesecurity/trufflehog@main` con `--only-verified`.

En GitHub, el check se ve como:  
**`security / secret-scan`**

---

## 3. Política recomendada de branch protection (main)

En GitHub → **Settings** → **Branches** → **Add branch protection rule**:

- **Branch name pattern:** `main`
- Activar:
  - ✅ **Require a pull request before merging**
  - ✅ **Require approvals** → `1`
  - ✅ *(Opcional pero recomendado)* **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require status checks to pass before merging**
    - Required checks:
      - `CI / lint-and-build`
      - `security / secret-scan`
  - ✅ **Require branches to be up to date before merging**
  - ✅ **Restrict who can push to matching branches** (si el plan de la org lo permite)
  - ✅ **Do not allow bypassing the above settings**

Esto garantiza:

- Nadie mergea directo a `main` sin PR y sin review.
- Ningún cambio llega a `main` con CI o security en rojo.
- Siempre se mergea desde una rama basada en el estado actual de `main`.

---

## 4. Qué se mantiene opcional (por ahora)

- **E2E como check obligatorio:**  
  - E2E ya está documentado en `ENGINEERING_WORKFLOW.md` (requerido para flujos críticos), pero no se añade aún como **status check obligatorio** hasta que la suite esté más madura.
- **Protección de `staging` y `dev`:**
  - Para un equipo pequeño con un solo deploy estable, se puede operar solo con `main` protegido (ver `ESTRATEGIA_RAMAS_GITHUB.md` → Opción A).
  - Si en el futuro se usa el flujo dev → staging → main, aplicar el mismo patrón de protección a `staging` y `dev`.

---

## 5. Founder-ready activation checklist

### Paso 1 — Verificar CI

1. Ir a la pestaña **Actions** en GitHub.
2. Confirmar que existen workflows:
   - `CI` con job `lint-and-build`
   - `security` con job `secret-scan`
3. Abrir un PR de prueba y comprobar que aparecen checks:
   - `CI / lint-and-build`
   - `security / secret-scan`

### Paso 2 — Configurar branch protection para `main`

1. GitHub → **Settings** → **Branches**.
2. Click en **Add branch protection rule** (o editar la existente si ya hay una).
3. En **Branch name pattern** escribir: `main`.
4. Marcar:
   - ✅ Require a pull request before merging
   - ✅ Require approvals → 1
   - ✅ Require status checks to pass before merging
     - En la lista, marcar:
       - `CI / lint-and-build`
       - `security / secret-scan`
   - ✅ Require branches to be up to date before merging
   - ✅ *(Opcional pero recomendado)* Dismiss stale approvals…
   - ✅ Restrict who can push to matching branches (si aplica)
   - ✅ Do not allow bypassing the above settings
5. Guardar la regla.

### Paso 3 — Confirmar que funciona

1. Crear rama `feature/branch-protection-check`.
2. Hacer un cambio mínimo y abrir PR hacia `main`.
3. Verificar que:
   - Se ejecutan `CI / lint-and-build` y `security / secret-scan`.
   - No permite **Merge** hasta que ambos estén en verde.
   - Hacer push directo a `main` debería estar bloqueado (según la regla).

---

## 6. Por qué este setup encaja con Smile/MedVoyage

- **Equipo pequeño / producto en MVP avanzado:**  
  - No mete capas pesadas (monorepo, múltiples environments forzados, docenas de checks).
  - Solo exige lo que ya está documentado como estándar: `verify` y `security`.
- **Protege lo importante:**  
  - El funnel assessment → lead → admin → pago no se rompe por un push directo o por saltarse CI.
  - Evita fugas de secrets por error humano.
- **Escalable a futuro:**  
  - Más adelante puedes:
    - Añadir `e2e` como required check.
    - Proteger `staging` o `dev` si adoptais el flujo completo.
    - Endurecer `npm audit` quitando `continue-on-error`.

En resumen, esta governance hace que las reglas que ya escribiste (DoR, DoD, ENGINEERING_WORKFLOW, QA_RELEASE_PLAYBOOK) sean **reales** en GitHub sin frenar la velocidad de desarrollo del equipo.

