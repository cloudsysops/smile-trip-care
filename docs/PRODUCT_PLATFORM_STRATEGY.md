# Product vs platform strategy (MedVoyage / Smile)

This document states how this repo relates to the rest of the workspace and how to develop going forward. It lives in the **canonical product repo** (smile-transformation-platform).

---

## 1. Roles in the workspace

| Role | Path | What it is |
|------|------|------------|
| **Product repo** | **smile-transformation-platform** (this repo) | The MedVoyage/Smile app: funnel, assessment, leads, recommendation, dashboards, Stripe, Supabase. Deployed to Vercel. **This is the canonical product.** |
| **Platform / reference repo** | **nuevo-repo** | EMPRESAS monorepo: many apps, packages, docs, CI, security, k8s. Use for patterns, runbooks, and reference. **Not the product.** |
| **Local tooling** | **scripts/** (at workspace root) | Mac station, dev setup, optimize, CLIs. Use for this machine. |
| **Not a product source of truth** | **empresas/** | Only logs. Treat as archive-only; do not use for product work. |

---

## 2. How future development should flow

### Product work (this repo)

- All feature work, bugfixes, and product docs happen in **smile-transformation-platform**.
- Deploy from here (Vercel). Branch, PR, merge to main as per your workflow.
- Do **not** duplicate product logic in nuevo-repo or elsewhere.
- Keep MVP stable: no broad refactors, no schema/migration/Stripe/auth core changes unless explicitly planned.

### When to copy patterns from nuevo-repo

- **Runbooks, go-live, security docs:** Copy or link when you need them (e.g. GO_LIVE_CHECKLIST, DEPLOYMENT, SECURITY.md).
- **Stripe setup (multi-env):** Use nuevo-repo `docs/WEBHOOKS.md` for local/staging/prod; implementation stays here.
- **CI:** Optional extra job (e.g. secret or dependency scan) — copy from nuevo-repo and simplify; keep current lint+test+env+build as main CI.
- **Conventions:** Commitlint, lint-staged — clone and adapt from nuevo-repo if you want them; not required.

### When not to unify code

- **Auth:** This repo uses Supabase + profiles + require*; nuevo-repo/wellness uses JWT. Do not unify without an explicit decision.
- **Codebases:** Keep two repos. Do not merge monorepo into this repo or vice versa in one big move.
- **Deploy:** This repo → Vercel; nuevo-repo may use k8s/Docker. No need for a single unified deploy pipeline.

---

## 3. Official usage rules

1. **This repo is the product.** Anything that is “the MedVoyage/Smile app” lives and ships from here.
2. **nuevo-repo is reference.** Use it to copy patterns and docs; do not treat it as the product codebase.
3. **scripts/ is for the machine.** Use it for station setup, dev setup, optimize, CLIs on this Mac.
4. **empresas/ is not product.** Do not add product code or treat it as source of truth; archive-only.

---

## 4. Master map and related docs

- **Workspace master map:** At workspace root: `PROYECTOS_MASTER_MAP.md` — canonical repo decisions, reuse strategy, archive list, “do not rebuild” checklist, next operating model.
- **Root audits:** `AUDITORIA_RAIZ_Y_ANALISIS_CHATGPT.md`, `AUDIT_RULES_GH_LOGIC_BACKEND_FRONTEND.md` — detailed audit and reuse by area (rules, GH, backend, frontend, integration, middleware, cloud).

When in doubt: ship product from this repo; copy from nuevo-repo when it saves time; do not rebuild what is already solved here or documented there.
