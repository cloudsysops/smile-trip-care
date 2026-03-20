# Sprint: QA/Release Toolkit & E2E — Final Report

**Sprint goal:** Professionalize the MedVoyage Smile engineering workflow with repeatable QA tooling, critical E2E coverage, and documented process.

**Classification:** **SAFE / MODERATE** — Tooling, scripts, E2E tests, and documentation only. No schema changes, no Stripe/auth core changes, no API contract changes.

---

## 1. QA maturity summary

| Area | Before | After |
|------|--------|--------|
| **Scripts** | `check-supabase-schema.sh`, `doctor-release.sh`, `smoke-deploy.sh`, `verify_all.sh`, `check_env.sh` | Same scripts in place; requirements (A/B/C) satisfied |
| **npm scripts** | `verify`, `verify:schema`, `doctor`, `smoke:deploy`, `test:e2e` | Confirmed and used |
| **Unit/Integration** | 23 test files, 69 tests (Vitest) | Unchanged |
| **E2E** | Playwright config present, no `e2e/` tests | `e2e/` added: assessment, proposal, WhatsApp CTA, mobile smoke |
| **Docs** | QA_RELEASE_PLAYBOOK.md | Playbook kept; ENGINEERING_WORKFLOW.md added; playbook extended with E2E note and enforceable-rules link |
| **Process** | Implicit | Explicit: pre-merge, pre-deploy, post-deploy; when E2E/schema required; enforceable rules |

**Still missing for “release-safe”:** (1) E2E run in CI against a stable host (or local build). (2) Remote schema in sync with local (founder/DevOps). (3) Mandatory smoke-deploy in CI or as a gate after deploy. (4) Optional: E2E against deploy host in CI.

---

## 2. Files created

- `docs/ENGINEERING_WORKFLOW.md` — When E2E/schema required; pre-merge / pre-deploy / post-deploy; rules for critical flows and Supabase; enforceable rules table.
- `docs/SPRINT_QA_RELEASE_FINAL_REPORT.md` — This report.
- `e2e/assessment.spec.ts` — Assessment happy path (steps 0–3, submit; success redirect or visible error).
- `e2e/proposal.spec.ts` — Proposal render (savings, journey, trust, CTA) + WhatsApp CTA href/message.
- `e2e/mobile-assessment.spec.ts` — Mobile viewport; form and submit CTA visible/reachable.

---

## 3. Files changed

- `docs/QA_RELEASE_PLAYBOOK.md` — Link to ENGINEERING_WORKFLOW (enforceable rules); E2E section (how to run, local vs deploy, coverage).
- `e2e/assessment.spec.ts` — Selectors: `#step-treatment`, exact "Next" button, error via text "could not save your request|try again".
- `e2e/proposal.spec.ts` — Selectors: `#savings-heading`, `#journey-heading`, `#trust-heading`; relaxed savings/journey text; CTA = WhatsApp link visible.
- `e2e/mobile-assessment.spec.ts` — `#step-treatment`; exact "Next" button.

---

## 4. Scripts (unchanged, already present)

- `scripts/check-supabase-schema.sh` — Local vs remote migrations; fail if remote behind; read-only.
- `scripts/doctor-release.sh` — Branch, git, verify, schema, optional smoke with host.
- `scripts/smoke-deploy.sh` — Host arg; routes `/`, `/assessment`, `/assessment/proposal`, `/login`, `/signup`, `/api/health`, `/api/leads`; 405 on `/api/leads` acceptable.

---

## 5. npm scripts (confirmed)

- `verify` — Lint + test + build.
- `verify:schema` — Schema alignment.
- `doctor` — Release doctor (no host).
- `smoke:deploy` — Usage: `npm run smoke:deploy -- <HOST>`.
- `test:e2e` — Playwright E2E.

---

## 6. E2E files

- `e2e/assessment.spec.ts` — Assessment happy path.
- `e2e/proposal.spec.ts` — Proposal render + WhatsApp CTA.
- `e2e/mobile-assessment.spec.ts` — Mobile assessment smoke.

**Mocks:** None. Assessment submit uses real POST /api/leads. Pass = redirect to proposal or visible error (e.g. schema/API failure).

---

## 7. What the new workflow covers

- **Pre-merge:** verify, optional verify:schema, E2E when touching critical flows.
- **Pre-deploy:** verify, verify:schema, optional doctor (with/without host).
- **Post-deploy:** smoke-deploy on canonical host; manual assessment submit + admin lead check.
- **Documented rules:** PRs touching critical flows → E2E; Supabase-related → schema check; deploy → smoke-deploy; env changes → update canonical env docs.

---

## 8. Local verification (this sprint)

| Check | Result |
|-------|--------|
| `npm run verify` | **Pass** (lint, 69 tests, build — after removing stale `.next/lock`) |
| `npm run verify:schema` | **Fail** (remote behind local — expected if migrations not pushed) |
| `npm run doctor` | **Fail** (schema; git uncommitted) — doctor logic OK |
| `npm run test:e2e` (default host) | **1/4 pass** (WhatsApp CTA); assessment/proposal/mobile fail on deploy host (deploy likely behind code) |
| `BASE_URL=http://localhost:3000 npm run test:e2e` | **4/4 pass** (with `npm run dev` on 3000) |

**Requires manual founder validation:** Schema alignment on target Supabase project; smoke-deploy against real canonical host after deploy; optional full E2E against deploy host after deploy.

**Depends on external/real state:** verify:schema (Supabase remote); E2E against deploy host (deploy must match codebase); smoke-deploy (live host).

---

## 9. Founder manual checks still required

1. After deploy: run `npm run smoke:deploy -- <CANONICAL_HOST>`.
2. After deploy: manual assessment submit on host; confirm redirect to proposal and lead in admin.
3. Before deploy (if PR touches DB): run `npm run verify:schema`; if fail, apply migrations (`supabase db push` or Dashboard) then re-check.
4. When changing env: update ENV_Y_STRIPE.md / playbook as needed.

---

## 10. Recommended next step

1. **CI:** Add a job that runs `npm run verify` and `npm run test:e2e` (e.g. against a preview URL or local build). Optionally run `verify:schema` in CI with linked Supabase project.
2. **Deploy discipline:** Make post-deploy smoke-deploy a required step (checklist or CI that hits the deployed URL).
3. **Schema:** Apply pending migrations to the dev/production Supabase project so `verify:schema` passes on the branch used for deploy.

---

**Sprint constraints respected:** No Supabase schema/migrations changes, no Stripe/auth core changes, no API contract changes, no broad refactors. Scope limited to tooling, E2E, process, and documentation.
