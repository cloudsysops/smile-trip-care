# Repository rename: smile-transformation-platform- → nebula-smile

**Goal:** Rename the GitHub repository to `nebula-smile` without breaking Vercel or local development.

**Owner:** cloudsysops  
**Current name:** smile-transformation-platform- (or nebula-smile if already renamed)  
**New name:** nebula-smile  

**Risk:** SAFE. No Supabase, Stripe, or schema changes.

---

## 1. Rename the repository in GitHub

1. Open: **https://github.com/cloudsysops/smile-transformation-platform-/settings**
2. Under **Repository name**, change:
   - From: `smile-transformation-platform-`
   - To: `nebula-smile`
3. Click **Rename**.

GitHub will show a warning that the old URL will redirect to the new one. Confirm.

---

## 2. Verify GitHub redirect

- Open the **old URL**: https://github.com/cloudsysops/smile-transformation-platform-
- It should redirect to: **https://github.com/cloudsysops/nebula-smile**
- Bookmarks and existing links will continue to work.

---

## 3. Update local repository remote

From the project root:

```bash
git remote set-url origin https://github.com/cloudsysops/nebula-smile.git
git remote -v
```

**Expected:**

```
origin  https://github.com/cloudsysops/nebula-smile.git (fetch)
origin  https://github.com/cloudsysops/nebula-smile.git (push)
```

---

## 4. Confirm Vercel integration still works

1. Go to [vercel.com](https://vercel.com) → your project (e.g. smile-transformation-platform-dev).
2. **Settings** → **Git**.
3. **Repository** should still show as connected (GitHub may show the new name `nebula-smile`).
4. If it shows disconnected or failed:
   - **Connect Git Repository** → choose **GitHub** → select **cloudsysops/nebula-smile**.
   - Reconnect and save.

---

## 5. Verify Production Branch

- In the same **Settings** → **Git** page:
- **Production Branch** must be **`main`**.
- If it changed, set it back to `main` and save.

---

## 6. Trigger a test deployment

From the project root (after steps 1–3):

```bash
git commit --allow-empty -m "test: repo rename verification"
git push origin main
```

Then:

1. Open **Vercel** → **Deployments**.
2. A new deployment for the latest commit should appear and complete (green).
3. If it fails, check **Build Logs** and that the Git repo is connected (step 4).

---

## 7. Confirm production URL still works

- **URL:** https://smile-transformation-platform-dev.vercel.app  
- Open in a browser (or incognito). The site should load; no change to the Vercel project URL is required for the repo rename.

---

## Summary checklist

| Step | Action | Done |
|------|--------|------|
| 1 | GitHub: Settings → Repository name → `nebula-smile` → Rename | |
| 2 | Verify old URL redirects to https://github.com/cloudsysops/nebula-smile | |
| 3 | Local: `git remote set-url origin https://github.com/cloudsysops/nebula-smile.git` and `git remote -v` | |
| 4 | Vercel: Settings → Git → repo still connected (reconnect if needed) | |
| 5 | Vercel: Production Branch = `main` | |
| 6 | `git commit --allow-empty -m "test: repo rename verification"` and `git push origin main`; check Deployments | |
| 7 | Confirm https://smile-transformation-platform-dev.vercel.app loads | |

---

**Do NOT modify:** Supabase, Stripe, database schema.
