# Vercel production verification guide — MedVoyage Smile

Step-by-step guide to verify your Vercel deployment state and run a smoke test. **No code changes** — verification and next actions only.

**Live URL (single project):** https://smile-transformation-platform-dev.vercel.app

---

## 1. Verify the connected Git repo in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Open your **Team** or personal account → select the **project** (name usually ends with `-dev`, e.g. `smile-transformation-platform-dev`).
3. Open **Settings** (top nav or project sidebar).
4. In the left sidebar, click **Git**.
5. Under **Git Repository** you should see:
   - **Connected** with the repo name, e.g. `cloudsysops/smile-transformation-platform-` (or your org/repo).
   - **Production Branch** (verified in step 2).

**What to confirm:** The repository shown is the MedVoyage Smile repo you push to. If it shows a different repo or “Not connected”, use **Connect Git Repository** to link the correct GitHub repo.

---

## 2. Verify the Production Branch is `main`

1. Still in **Settings** → **Git**.
2. Find **Production Branch**.
3. It must be **`main`** (lowercase). If it shows `master`, `production-hardening`, or anything else, change it to `main` and **Save**.

**Why it matters:** Only pushes to the Production Branch trigger a production deploy. If this is wrong, merges to `main` won’t update the live site.

---

## 3. Identify the latest deployment status

1. In the project, open the **Deployments** tab (top nav).
2. The **first row** is the most recent deployment. Check:
   - **Status:** Green (Ready) / Red (Failed) / Yellow (Building).
   - **Branch:** Should be `main` for production.
   - **Commit message:** Should match your latest merge (e.g. landing or patient journey).
   - **Time:** When it was deployed.

**Interpretation:**

| Status   | Meaning |
|----------|--------|
| **Ready** (green) | Build and deploy succeeded. This commit is what production can serve. |
| **Failed** (red)  | Build or deploy failed. Go to **Section 4** (build logs). |
| **Building**      | Wait a few minutes and refresh. |

If the latest deployment is from **main** and **Ready**, production is serving that commit. If the site still looks old, go to **Section 5** (stale deploy).

---

## 4. If the latest deployment failed — what to inspect in build logs

1. In **Deployments**, click the **failed** (red) deployment.
2. Open **Building** or **Build Logs** (depending on UI).
3. Scroll to the **bottom** first — the error is usually in the last 20–40 lines.

**What to look for:**

| Error type | Where in logs | What to do |
|------------|----------------|------------|
| **Missing env var** | “Environment variable X is not set” or build step failing when reading env | Add the variable in **Settings → Environment Variables** (Production). Then **Redeploy** (Section 5). |
| **npm install / dependency** | “Cannot find module”, “ERESOLVE”, or npm error | Check `package.json` and lockfile; ensure they’re committed. Fix version or dependency and push to `main` (no change to code in this guide — just note for later). |
| **TypeScript / lint** | “Type error”, “ESLint error” | Note the file and line; fix in your repo and push to `main`. |
| **Next.js build** | “Error: …” during “Running build” or “Collecting page data” | Read the line above the error (often a missing import, bad dynamic route, or server component issue). Fix in repo and push. |
| **Out of memory / timeout** | “JavaScript heap out of memory” or “Command timed out” | In Vercel, consider increasing Node version or build settings; or optimize the build locally and push again. |

4. After you fix the cause (env, code, or config), trigger a new deploy:
   - Push a new commit to `main`, or  
   - Use **Redeploy** (Section 5) for the same commit after fixing env.

---

## 5. If the deployment is green but the site looks stale

1. **Confirm Production is using the latest deploy**
   - In **Deployments**, the top (latest) deployment should show a **Production** badge or be the one assigned to your production domain.
   - If an older deployment is still “Production”, open the **newest green** deployment → menu (⋯) → **Promote to Production** (if available).

2. **Force a redeploy**
   - Open the **latest deployment** (top of list).
   - Click the **⋯** (three dots) menu.
   - Choose **Redeploy**.
   - Optionally **uncheck** “Use existing Build Cache” for a clean build.
   - Confirm. Wait until the new deployment shows **Ready**.

3. **Verify the live URL**
   - Open in a **private/incognito** window (to avoid cache):  
     **https://smile-transformation-platform-dev.vercel.app/**
   - Hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).
   - You should see the current MedVoyage Smile landing (e.g. “World-class dental care in Colombia”, “Start Free Smile Evaluation”). If you still see old copy, clear cache or try another device/network.

---

## 6. Route-by-route smoke test checklist

Use this after deployment is **Ready** and you’ve confirmed the live URL looks correct. Base URL: **https://smile-transformation-platform-dev.vercel.app**

| # | Route | What to do | Expected |
|---|--------|------------|----------|
| 1 | **/** | Open in browser: `https://smile-transformation-platform-dev.vercel.app/` | 200. Landing loads: hero “Transform Your Smile…”, How it works, Verified Clinics, CTAs. No blank or 5xx. |
| 2 | **/packages** | Open: `https://smile-transformation-platform-dev.vercel.app/packages` | 200. Packages listing (or empty state). No 404/5xx. |
| 3 | **/assessment** | Open: `https://smile-transformation-platform-dev.vercel.app/assessment` | 200. Assessment form loads. Can submit or see validation. No 404/5xx. |
| 4 | **/patient** | Open: `https://smile-transformation-platform-dev.vercel.app/patient` | 302 redirect to login (or 200 if already logged in as patient). No 5xx. |
| 5 | **/api/health** | Open in new tab or use `curl`: `https://smile-transformation-platform-dev.vercel.app/api/health` | 200. JSON with `"ok": true`, `"status": "ok"`, `"service": "nebula-smile"`. |
| 6 | **/api/health/ready** | Open: `https://smile-transformation-platform-dev.vercel.app/api/health/ready` | 200. Body can be OK or JSON; no 5xx. Indicates app and dependencies (e.g. Supabase) are reachable. |

**How to run the checklist**

- **Browser:** For `/`, `/packages`, `/assessment`, `/patient` — open each URL and confirm status (no error page) and that the page content loads.
- **APIs:** For `/api/health` and `/api/health/ready` you can:
  - Open the URL in the browser and check the JSON/response, or
  - Run:  
    `curl -s -o /dev/null -w "%{http_code}" https://smile-transformation-platform-dev.vercel.app/api/health`  
    `curl -s -o /dev/null -w "%{http_code}" https://smile-transformation-platform-dev.vercel.app/api/health/ready`  
    Both should output `200`.

**If something fails**

- **404 on a page:** Confirm the route exists in the app (e.g. `app/page.tsx`, `app/packages/page.tsx`). No code change in this guide — just note and fix in repo.
- **5xx on a page or API:** Check **Vercel → Deployments → [latest] → Functions / Runtime Logs** for errors; often env (e.g. Supabase) or runtime error.
- **/api/health or /api/health/ready 5xx:** Usually missing or wrong env (e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Fix in **Settings → Environment Variables** and redeploy.

---

## Quick reference

| Step | Where | Action |
|------|--------|--------|
| 1. Git repo | Vercel → Project → **Settings → Git** | Confirm repo connected = MedVoyage Smile repo. |
| 2. Production branch | Same page | **Production Branch** = `main`. |
| 3. Latest deploy | **Deployments** tab | Top row = latest; note Ready / Failed / Building. |
| 4. Build failed | Click failed deploy → **Build Logs** | Read bottom of log; fix env/code and push or redeploy. |
| 5. Stale but green | **Deployments** → latest → ⋯ → **Redeploy** | Then open live URL in incognito and hard refresh. |
| 6. Smoke test | Browser + optional curl | Use table above for `/`, `/packages`, `/assessment`, `/patient`, `/api/health`, `/api/health/ready`. |

---

**Document:** Vercel production verification for MedVoyage Smile. No code changes; verification and next actions only.  
**Live URL:** https://smile-transformation-platform-dev.vercel.app
