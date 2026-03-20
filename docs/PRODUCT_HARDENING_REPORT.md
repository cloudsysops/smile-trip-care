# Product hardening report — MedVoyage Smile

**Sprint:** Low-risk product hardening pass.  
**Risk classification:** SAFE / MODERATE only.  
**Date:** 2026-03-11.

---

## 1. Current funnel health

### Critical flow (audit)

| Step | Route / action | Current state |
|------|----------------|---------------|
| **Landing** | `/` | Serves landing with packages, CTAs, “Start Free Evaluation”. No issues found. |
| **Assessment** | `/assessment` | Renders `AssessmentWizard` (steps: treatment → smile history → timeline → contact). Prefill from `?package=` works. |
| **Submit** | POST `/api/leads` | Validates (Zod), honeypot, rate limit. Inserts lead; 201 returns `lead_id` + `recommended_package_slug`. On insert error returns 500 with “We could not save your request. Please try again.” Logging: request hit, validation fail, honeypot, lead created, insert failed (with request_id, step, supabase_code/message). |
| **Redirect** | After 201 | Client reads `lead_id` (and optional `recommended_package_slug`), builds `/assessment/proposal?lead_id=...&recommended_package_slug=...` and `router.push()`. Behavior is correct. |
| **Proposal** | `/assessment/proposal` | Accepts `lead_id` and `recommended_package_slug`. Loads lead context for treatment types; shows savings, journey, trust, WhatsApp CTA. Renders without lead_id (generic proposal). No fragile redirect assumptions. |
| **Admin** | `/admin/leads` | Requires admin; loads leads (id, name, email, status, created_at, last_contacted_at, next_follow_up_at, recommended_package_slug), ordered by created_at desc. List shows Name, Email, Priority, Status, Next action, Next follow-up, Created, Open. |
| **Admin detail** | `/admin/leads/[id]` | Full lead (select("*")), status, recommendation, deposit CTA, lead details, AI triage/messages, outbound, itineraries. Treatment intent (selected_specialties, message, package_slug) visible on detail. |

### Lead submission path

- **Path:** AssessmentWizard step 3 → POST /api/leads with wizard payload (first_name, last_name, email, treatment_focus, smile_history, timeline, etc.).
- **Success:** 201 with `lead_id` → redirect to `/assessment/proposal?lead_id=...` (and recommended_package_slug if present).
- **Failure:** 4xx/5xx → error message set from `resData.error` or “Something went wrong. Please try again.” (network path: “Network error. Please try again.”). Message shown in alert box above form; form remains submittable.

### Error handling (summary)

- **API:** 400 validation → “Validation failed. Check your name, email, and other fields.” 429 → “Too many requests. Please try again later.” 500 insert → “We could not save your request. Please try again.” Catch-all 500 → “Server error.”
- **Client:** Server error text shown as-is when provided; else “Something went wrong. Please try again.” or “Network error. Please try again.” Copy is clear and non-technical.

### Redirect behavior

- Redirect only when `res.ok` and `typeof resData.lead_id === "string"`. Params built via URLSearchParams; no brittle string concatenation.

### Proposal rendering

- Works with or without `lead_id`. With lead_id, fetches lead for treatment types and package preference; otherwise uses recommended_package_slug and defaults. No hard dependency that would 500 if lead missing.

### Admin visibility path

- New leads appear in `/admin/leads` (ordered by created_at desc). Contact info (name, email) in list; “Open” goes to detail. Treatment intent and full context on `/admin/leads/[id]`.

---

## 2. Verification results

| Check | Command | Result |
|-------|---------|--------|
| **Lint** | `npm run verify` (lint phase) | Pass |
| **Tests** | `npm run verify` (test phase) | Pass (23 files, 69 tests) |
| **Build** | `npm run verify` (build phase) | Pass |
| **Doctor** | `npm run doctor` | Verify: OK. Schema: **FAIL** (remote behind local migrations). Git: uncommitted changes. Smoke: skipped (no host). |

**Smoke deploy (prepared command; run when deploy is live):**

```bash
npm run smoke:deploy -- https://smile-transformation-platform-dev.vercel.app
```

Or:

```bash
./scripts/smoke-deploy.sh https://smile-transformation-platform-dev.vercel.app
```

---

## 3. Low-risk improvements made

- **Docs only:** In `docs/QA_RELEASE_PLAYBOOK.md`, added one sentence stating this repo is the canonical MedVoyage Smile product and linking to [PRODUCT_PLATFORM_STRATEGY.md](PRODUCT_PLATFORM_STRATEGY.md) for product vs platform separation. No code or schema changes.

---

## 4. Issues found but deferred

- **Schema alignment:** Remote Supabase is behind local migrations. Fix: `supabase db push` or apply migrations via Dashboard (see MIGRATION_ORDER.md). Must be done before deploy to avoid POST /api/leads 500.
- **201 without lead_id:** If the API ever returned 201 without `lead_id`, the client would set status to “idle” and not redirect; user would see no success message. Edge case; current API always returns lead_id on 201. Deferred unless observed.
- **Admin list treatment:** Treatment intent (e.g. “Dental Implants”) is not in the list table; it is on the detail page. Acceptable for current scope; can add a column later if needed.

---

## 5. Manual founder checks still needed

1. **After deploy:** Run `npm run smoke:deploy -- https://smile-transformation-platform-dev.vercel.app` and confirm all routes pass.
2. **After deploy:** Submit one assessment on the deploy host; confirm redirect to proposal and that the lead appears in Admin → Leads.
3. **Before deploy (if schema changed):** Run `npm run verify:schema`; if it fails, apply migrations to the Supabase project used by the deploy target.
4. **Canonical host:** Use `https://smile-transformation-platform-dev.vercel.app` for QA (see QA_RELEASE_PLAYBOOK.md).

---

## 6. Recommended next sprint

- **Option A (operational):** Apply pending migrations to the linked Supabase project so `verify:schema` passes and POST /api/leads is stable on deploy.
- **Option B (process):** Add a CI job that runs `npm run verify` and, if feasible, `npm run smoke:deploy` against the canonical host after deploy.
- **Option C (product):** Small conversion/UX improvements (e.g. one clear CTA on proposal, or adding treatment column to admin leads list) as a follow-up, still SAFE/MODERATE only.

---

## 7. Files reviewed (no changes)

- `app/page.tsx` — Landing
- `app/assessment/page.tsx` — Assessment entry
- `app/assessment/AssessmentWizard.tsx` — Wizard and submit/redirect
- `app/assessment/AssessmentForm.tsx` — Legacy form (not used by assessment page; AssessmentWizard used)
- `app/assessment/proposal/page.tsx` — Proposal render and lead context
- `app/api/leads/route.ts` — POST lead create, logging, error responses
- `app/admin/leads/page.tsx` — Admin leads list
- `app/admin/leads/AdminLeadsList.tsx` — List table and priority
- `app/admin/leads/[id]/page.tsx` — Lead detail
- `docs/QA_RELEASE_PLAYBOOK.md` — Pre/post deploy, canonical host
- `docs/ENGINEERING_WORKFLOW.md` — E2E/schema rules, checklists
- `docs/PRODUCT_PLATFORM_STRATEGY.md` — Product vs platform, canonical repo

---

## 8. Exact files changed

- `docs/PRODUCT_HARDENING_REPORT.md` — created (this report).
- `docs/QA_RELEASE_PLAYBOOK.md` — added one-line product/repo pointer and link to PRODUCT_PLATFORM_STRATEGY.md.

---

## 9. Summary for founder

- **Funnel:** Landing → assessment → POST /api/leads → redirect to proposal → admin sees lead. Flow is consistent and documented.
- **Verify:** Lint, test, and build pass. Doctor passes verify; schema check fails until remote migrations are applied; smoke not run (no host in command).
- **Improvements:** No code changes; hardening was audit + verification + this report.
- **Deferred:** Schema sync, edge case 201-without-lead_id, optional treatment column in admin list.
- **Next:** Apply migrations for deploy stability; run smoke after deploy; optionally add CI for verify + smoke.
