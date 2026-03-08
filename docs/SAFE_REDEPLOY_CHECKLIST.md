# Safe redeploy checklist — Local → Vercel

**Target URL:** https://smile-transformation-platform-dev.vercel.app/  
**Proyecto Vercel:** solo uno (nombre termina en `-dev`). Ver [VERCEL_UN_SOLO_PROYECTO.md](VERCEL_UN_SOLO_PROYECTO.md).  
**Deploy branch:** `main`.

---

## 1. Repo status

| Item | Status |
|------|--------|
| **Deploy branch** | `main` |
| **Working tree** | Debe estar limpio antes de deploy; hacer `git status`. |
| **Sincronización** | `git pull origin main` antes de deploy; después `git push origin main` si hay commits locales. |

**Summary:** Código unificado (landing, auth/roles, admin CRUD, automation, outbound, migraciones 0001–0018). Ver [STATUS.md](../STATUS.md) y [supabase/migrations/MIGRATION_ORDER.md](../supabase/migrations/MIGRATION_ORDER.md).

---

## 2. Files changed (summary)

### Modified (tracked)

- **Landing / public:** `app/page.tsx`, `app/packages/[slug]/page.tsx`, `app/assessment/*`, `app/thank-you/page.tsx`, `app/layout.tsx`
- **Admin:** `app/admin/leads/*`, `app/admin/login/page.tsx`
- **API:** `app/api/leads/route.ts`, `app/api/stripe/checkout/route.ts`, `app/api/stripe/webhook/route.ts`
- **Lib:** `lib/auth.ts`, `lib/config/server.ts`, `lib/packages.ts`, `lib/validation/lead.ts`
- **Docs:** README.md, STATUS.md, several files in `docs/`
- **Scripts/tests:** `scripts/deploy_verify.sh`, `scripts/verify_all.sh`, `package.json`, test files
- **Deleted:** `middleware.ts`

### Untracked (new)

- New app routes: `app/login/`, `app/signin/`, `app/coordinator/`, `app/provider/`, `app/specialist/`, `app/patient/`, `app/admin/overview/`, `app/admin/providers/`, etc.
- New API routes: `app/api/auth/me/`, `app/api/admin/*` (bookings, consultations, experiences, packages, providers, specialists)
- New lib: `lib/bookings.ts`, `lib/consultations.ts`, `lib/dashboard-data.ts`, `lib/experiences.ts`, `lib/providers.ts`, `lib/specialists.ts`, validation schemas
- Migrations: `supabase/migrations/0001` through `0018` (orden en [MIGRATION_ORDER.md](../supabase/migrations/MIGRATION_ORDER.md))
- Scripts: `run_migrations.sh`, `run_seed_marketplace.sh`, seed SQL files
- Docs: multiple new docs (AUTH_AND_ROLES, DASHBOARD_ROLES, sprint reports, etc.)
- `.cursor/rules/controlled-execution-policy.mdc`, `AGENTS.md`

**Landing / packages:** Hero CTAs (Start Free Evaluation, View Packages, WhatsApp), trust + legal clarity, “Why Medellín + Manizales,” upgraded package cards (journey type, deposit, “Start with this package”), section titles (Meet Our Specialists, Recovery Experiences, FAQ). All safe for deploy from a content/UX perspective; no architecture changes.

---

## 3. Build validation result

| Step | Result |
|------|--------|
| `npm run lint` | **Passed** |
| `npm run test` | **Passed** (32 tests) |
| `npm run build` | **Passed** (Next.js build OK) |

No errors. Project is ready to commit and push for redeploy.

---

## 4. Git commands to run

Run these **from the project root** (`smile-transformation-platform/`):

```bash
# Add all changes (modified, new, and deletions)
git add .

# Commit with a clear message
git commit -m "feat: landing sales upgrade, auth/roles, admin CRUD, dashboards; ready for dev redeploy"

# Push to main (único proyecto Vercel usa main)
git push origin main
```

**Note:** Hay un solo proyecto en Vercel (URL -dev). Debe estar conectado a la rama `main`.

**Do not run:** `git reset --hard`, `git push --force`, or any command that would overwrite remote history without your explicit intent.

---

## 5. Deploy instructions

**Importante:** Solo hay un proyecto en Vercel (nombre que termina en `-dev`). En Settings → Git, **Production Branch** debe ser `main`. Cada push a `main` despliega a https://smile-transformation-platform-dev.vercel.app/

- **If** the Vercel project “smile-transformation-platform-dev” is connected to the repo and to branch **production-hardening**:  
  Pushing `production-hardening` will trigger an **automatic deploy**. The new build will appear at https://smile-transformation-platform-dev.vercel.app/ once the build finishes.

- **If** the dev URL is tied to **main** (or another branch):  
  1. Merge `production-hardening` into that branch (e.g. `git checkout main && git merge production-hardening`), then `git push origin main`,  
  or  
  2. In Vercel Dashboard → Project → Settings → Git, set the “Production Branch” or “Preview” branch to `production-hardening` so the next push deploys from it.

- **Manual redeploy:** Vercel Dashboard → Project → Deployments → … on latest deployment → “Redeploy”. Use this only if you want to redeploy the same commit; for the **current local version** you must push first so the new commit is built.

---

## 6. Post-deploy verification checklist

After the deploy completes:

1. **Health**
   - Open: `https://smile-transformation-platform-dev.vercel.app/api/health`  
   - Expect: `200` and JSON with `ok: true`, `service: "nebula-smile"`.

2. **Homepage**
   - Open: `https://smile-transformation-platform-dev.vercel.app/`  
   - Expect: Hero with “Start Free Evaluation”, “View Packages”, “Chat on WhatsApp”; trust section; package cards with deposit and “Start with this package”.

3. **Packages section**
   - Scroll to packages or open `/#packages`.  
   - Expect: Cards show journey type, cities, deposit, and CTA “Start with this package”.

4. **Assessment flow**
   - Click “Start Free Evaluation” or go to `/assessment`.  
   - Submit the form (test data).  
   - Expect: Redirect to thank-you and no console/network errors.

5. **Script (recommended)**
   ```bash
   ./scripts/deploy_verify.sh https://smile-transformation-platform-dev.vercel.app/
   ```
   Expect: “GET $BASE → 200” and “GET $BASE/api/health → 200”.

---

## Summary

| Item | Value |
|------|--------|
| **Repo status** | Branch `main`; working tree limpio o con cambios commiteados |
| **Files changed** | Según `git status` |
| **Build validation** | Lint, test, build all passed |
| **Git commands** | `git add .` → `git commit -m "..."` → `git push origin main` |
| **Deploy** | Un solo proyecto Vercel (-dev); Production Branch = `main`. Push a main → deploy automático. |
| **Verification** | Health, homepage, packages, assessment + `deploy_verify.sh` |

These changes are safe to deploy for dev/testing: no destructive refactors, architecture unchanged, and validation passed. Ensure Supabase migrations (0006–0011) are applied on the Supabase project used by this deployment before relying on new features (e.g. roles, dashboards).
