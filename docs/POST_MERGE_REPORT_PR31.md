# Post-merge report — PR #31 (Rebrand to MedVoyage Smile)

**Merged:** 2026-03-09 (squash, branch deleted)  
**Scope:** Full brand transformation — Nebula Smile → MedVoyage Smile

---

## 1. Merge

- **PR #31** merged with **squash** into `main`.
- Branch **feature/rebrand-medvoyage-smile** deleted.

---

## 2. CI on main

- **Status:** Green.
- **Run:** `feat(brand): rebrand to MedVoyage Smile — full product name and docs` — **completed / success** (main, push, ~1m9s).

---

## 3. Vercel deployment

- **Production URL:** https://smile-transformation-platform-dev.vercel.app
- **Deploy verify:** `./scripts/deploy_verify.sh <URL>` — **passed** (GET `/` → 200, GET `/api/health` → 200).
- Latest deployment from `main` (merge commit) is **live** — confirmed via successful route checks and brand check below.

---

## 4. Route verification

All of the following returned **HTTP 200** (with redirects followed):

| Route | Status |
|-------|--------|
| `/` | 200 |
| `/packages` | 200 |
| `/assessment` | 200 |
| `/thank-you` | 200 |
| `/login` | 200 |
| `/signup` | 200 |
| `/patient` | 200 |
| `/dental-implants-colombia` | 200 |
| `/veneers-colombia` | 200 |
| `/hollywood-smile-colombia` | 200 |
| `/api/health` | 200 |

---

## 5. Visible product brand in production

**Confirmed:** The visible product brand in production is **MedVoyage Smile**.

- **Landing page (/):** HTML contains **20 occurrences** of “MedVoyage Smile”; **0** occurrences of “Nebula Smile”.
- **API health:** Response includes `"service": "medvoyage-smile"`.

Production is serving the rebranded app. The founder can continue selling with the new brand immediately.

---

## 6. Summary

- Merge and branch cleanup: **done.**
- CI on main: **green.**
- Latest Vercel deployment: **live** (from merge commit).
- All requested routes: **200.**
- **Visible product brand in production:** **MedVoyage Smile.**
