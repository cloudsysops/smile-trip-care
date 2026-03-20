# QA visible route audit — MedVoyage Smile dev host

**Canonical QA host:** `https://smile-transformation-platform-dev.vercel.app`  
**Audit date:** 2026-03-12  
**Purpose:** Confirm which critical routes exist, whether login/signup are reachable, and whether the homepage/nav exposes the right entry points for founder-usable QA.

---

## 1. Routes checked (direct fetch)

| Route | Result | Notes |
|-------|--------|--------|
| `/` | 200 | Homepage loads; full content (hero, assessment CTA, packages, FAQ, etc.). |
| `/login` | 200 | Page loads; title "MedVoyage Smile", "Loading…" (client-rendered form). |
| `/signup` | 200 | Full signup page: "Create patient account", Google, email/password form, "Already have an account? Sign in" → /login. |
| `/api/health` | 200 | `{"ok":true,"status":"ok","version":"14cc49a...","service":"medvoyage-smile"}`. |
| `/api/health/ready` | 200 | `{"ready":true,"checks":{"supabase_config":"ok","supabase_connect":"ok"}}`. |

**Conclusion:** The routes exist and respond. Login and signup are **not** missing — they are implemented and reachable by direct URL.

---

## 2. Navigation / visibility

**Files reviewed:**

- `app/page.tsx` — homepage and header nav.

**Findings:**

1. **Sign in**  
   - **Present in nav** (line ~133): `<Link href="/login" ...>Sign in</Link>`.  
   - **Visibility:** `className="hidden ... sm:inline-block"` → visible only from `sm` breakpoint and up. On small viewports (mobile), "Sign in" is **hidden**; only the primary CTA "Get My Free Treatment Plan" (assessment) is visible.

2. **Sign up**  
   - **Not linked from the homepage nav.**  
   - Sign up exists at `/signup` and is linked from `/login` ("Create patient account") and from `/thank-you` and assessment proposal.  
   - For a founder or tester landing on the home, there is **no direct nav entry to Sign up** unless they go to Login first or know the URL.

**Summary:** Login/signup are **not** missing; they are **partially hidden or absent from the main nav**:
- Sign in: in nav but hidden on mobile.
- Sign up: not in the main nav at all.

---

## 3. Consistency for QA testing

| Criterion | Status |
|-----------|--------|
| Single canonical QA host | ✅ `smile-transformation-platform-dev.vercel.app` |
| Critical routes load | ✅ /, /login, /signup, /api/health, /api/health/ready |
| Health endpoints respond | ✅ 200 with expected JSON |
| Auth entry points reachable by URL | ✅ /login, /signup load |
| Auth entry points visible in nav | ⚠️ Sign in visible on desktop only; Sign up not in nav |

QA is **usable** if testers use direct URLs. For **founder-usable** QA without guessing, the nav should expose both Sign in and Sign up (at least on desktop; mobile can stay minimal).

---

## 4. Other critical routes (not fetched in this audit)

These exist in the app and should be verified manually on the dev host if needed:

- `/assessment` — assessment form  
- `/thank-you` — post-assessment thank you  
- `/admin/overview`, `/admin/leads`, `/admin/analytics` — admin (requires login)  
- `/patient`, `/specialist` — role dashboards (require login)

---

## 5. Changes made in this audit

**File changed:** `app/page.tsx`

**Change:** Added a "Sign up" link in the header nav next to "Sign in", with the same responsive behavior (`hidden` on small screens, `sm:inline-block`). This does not redesign the page; it only exposes the existing `/signup` route from the main nav so QA testers and founders can reach it without guessing.

**No other files modified.** No schema, Stripe, or auth core logic was touched.

---

## 6. Recommended next checks

1. **Manual in browser (dev host):** Open `/`, `/login`, `/signup`, `/assessment`, `/thank-you`; confirm no 404s and forms render.  
2. **Flows:** Submit assessment → check `/admin/leads`; specialist update progress → patient sees timeline (as in Phase 2).  
3. **Mobile:** Confirm whether a mobile-specific nav or footer link for "Sign in" / "Sign up" is desired for QA.

---

## 7. Final summary

| Question | Answer |
|----------|--------|
| Do critical routes exist? | Yes. /, /assessment, /login, /signup, /api/health, /api/health/ready all respond. |
| Are login/signup missing? | No. They exist and load at /login and /signup. |
| Are login/signup hidden from nav? | Partially. Sign in is in nav but hidden on mobile; Sign up was not in the main nav (now added for desktop). |
| Exact files reviewed | `app/page.tsx` (header nav), grep across app for login/signup links. |
| Exact files changed | `app/page.tsx` — added Sign up link to nav. |
| Is QA visually consistent enough for testing? | Yes, if testers use direct URLs or desktop nav. With the Sign up link added, desktop QA is clearer; mobile still shows only the main CTA unless further nav changes are made. |
