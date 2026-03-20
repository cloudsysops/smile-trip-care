# QA and deploy (MedVoyage Smile)

Short reference for canonical QA host, pre-deploy and post-deploy checks, and product vs platform. This repo is the **canonical product repo**; deploy target is Vercel.

---

## Canonical QA host

- **Default QA / preview host:** `https://smile-transformation-platform-dev.vercel.app`  
  (Update this if your Vercel project or URL changes.)
- Use this URL for smoke tests and doctor runs before/after deploy.

---

## Pre-deploy checks

1. **Verify (required)**  
   ```bash
   npm run verify
   ```  
   Runs: lint, test, build. Must pass before merging to main / deploying.

2. **Schema alignment (recommended)**  
   ```bash
   bash scripts/check-supabase-schema.sh
   ```  
   Ensures local expectations match Supabase. Do not create or edit migrations in a “hardening-only” sprint.

3. **Doctor with smoke (recommended when deploying)**  
   ```bash
   ./scripts/doctor-release.sh https://smile-transformation-platform-dev.vercel.app
   ```  
   Runs: git status, critical route files, verify, schema check, smoke against the given host.

---

## Post-deploy checks

1. **Health**  
   `GET <deploy-url>/api/health` → expect 200.

2. **Critical routes (smoke)**  
   ```bash
   ./scripts/smoke-deploy.sh https://smile-transformation-platform-dev.vercel.app
   ```  
   Checks: `/`, `/assessment`, `/assessment/proposal`, `/login`, `/signup`, `/api/health`, `/api/leads` (non-404).

3. **Manual (when possible)**  
   - Submit one assessment and confirm redirect to proposal and visibility in admin.
   - Log in as admin and open a lead to confirm contact info and actions.

---

## Product vs platform

- **This repo (smile-transformation-platform)** = product. All feature work and deploys from here. See [PRODUCT_PLATFORM_STRATEGY.md](PRODUCT_PLATFORM_STRATEGY.md).
- **nuevo-repo** = platform/reference only. Do not deploy it as the MedVoyage product.

---

## Commands summary

| Command | Purpose |
|--------|----------|
| `npm run verify` | Lint + test + build (required before deploy) |
| `npm run doctor` | Local doctor only (no host) |
| `./scripts/doctor-release.sh <HOST>` | Doctor + smoke against HOST |
| `./scripts/smoke-deploy.sh <BASE_URL>` | Smoke critical routes only |
| `npm run smoke:deploy -- <URL>` | Same as smoke-deploy.sh |
