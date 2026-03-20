# Post-merge verification — PR #23 & PR #24

**Date:** 2026-03-08  
**PRs:** #23 (landing treatment links), #24 (env.example NEXT_PUBLIC_APP_URL)

---

## 1. Merge status

| PR   | Title                                              | State   | Merged into main |
|------|----------------------------------------------------|--------|-------------------|
| #23  | fix: landing treatment links 404 → existing package slugs | **OPEN** | No  |
| #24  | docs: add NEXT_PUBLIC_APP_URL example for custom domain    | **OPEN** | No  |

**Conclusion:** Both PRs are **not merged**. Latest merge on `main` is PR #22 (Landing: Silicon Valley-style redesign). Post-merge verification cannot be completed until #23 and #24 are merged.

---

## 2. CI on main

- **Latest run:** Push “Landing: Silicon Valley-style redesign…” (run ID 22828439659).
- **Result:** Failed at **Build** step (lint and test passed).
- **Conclusion:** CI on `main` is currently **failing**. Fix the build on `main` before or after merging #23/#24; merge will trigger a new run.

---

## 3. Vercel deployment

- **Dev URL:** https://smile-transformation-platform-dev.vercel.app
- **Status:** Deployment is live (root and `/api/health` return 200).
- **Conclusion:** Cannot confirm “deployment completed for #23/#24” because those PRs are not merged. Current deployment reflects `main` as of PR #22.

---

## 4. Route verification (current deployment)

| Route         | Expected | Actual |
|---------------|----------|--------|
| `/`           | 200      | 200    |
| `/packages`   | 200      | 200    |
| `/assessment` | 200      | 200    |
| `/api/health` | 200      | 200    |

---

## 5. Treatment cards (current main / deployment)

- **On `main`:** Treatment card links still use slugs `dental-implants`, `hollywood-smile`, `smile-design`.
- **Live check:**  
  - `/packages/dental-implants` → **404**  
  - `/packages/essential-care-journey` → **404** (dev deployment; prod DB may not have this package seeded).
- **Conclusion:** The three treatment cards **still 404** on current deployment until PR #23 is merged. After #23, cards will point to `essential-care-journey`, `comfort-recovery-journey`, `premium-transformation-experience`; those pages will 200 only if the deployed environment has those packages in the DB.

---

## 6. .env.example on main

- **Current `main`:** `.env.example` does **not** contain the `NEXT_PUBLIC_APP_URL` comment/example.
- **Conclusion:** PR #24 is not merged; the NEXT_PUBLIC_APP_URL example will appear on `main` only after merging #24.

---

## 7. Release report (short)

| Item                          | Status |
|-------------------------------|--------|
| PR #23 merged to main         | No — PR open |
| PR #24 merged to main         | No — PR open |
| CI passed (for these PRs)     | N/A — not merged |
| Vercel deploy for these PRs   | N/A — not merged |
| `/`, `/packages`, `/assessment`, `/api/health` | 200 on current dev deployment |
| Treatment cards no longer 404 | No — main still uses old slugs; merge #23 required |
| .env.example has NEXT_PUBLIC_APP_URL example on main | No — merge #24 required |

**Recommended next steps**

1. Merge PR #23 and PR #24 into `main` (after founder approval).
2. Fix the failing **Build** on `main` (investigate run 22828439659) so CI is green.
3. After merge, confirm in GitHub that the new CI run for `main` passes.
4. Confirm in Vercel that the latest deployment from `main` completed successfully.
5. Re-run this verification: hit `/`, `/packages`, `/assessment`, `/api/health`, and the three package URLs (`/packages/essential-care-journey`, etc.), and confirm `.env.example` on `main` contains the NEXT_PUBLIC_APP_URL block.

---

*Generated for post-merge verification request; PRs were still open at verification time.*
