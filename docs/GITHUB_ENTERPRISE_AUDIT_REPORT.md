# GitHub Enterprise Setup — Audit Report

**Repository:** Nebula Smile  
**Owner:** cloudsysops  
**Audit date:** Generated from repo and gh CLI.  
**Scope:** Connection, gh CLI, security practices, branch strategy, CI, automation commands. No destructive changes; no fake auth.

---

## Step 1 — GitHub connection status

### Verified

| Check | Result |
|-------|--------|
| **Git remote** | `origin` → `https://github.com/cloudsysops/smile-transformation-platform-.git` (fetch + push) |
| **Default branch** | `main` |
| **Viewer permission** | `ADMIN` (current gh user has full repo admin) |
| **Visibility** | `PUBLIC` |
| **Current local branch** | `main` (in sync with origin at commit 4b730fc) |

### Conclusion

The repo is correctly connected. The default branch is `main`; you have ADMIN permission; visibility is PUBLIC. If you prefer a private repo for SaaS, change it in **Settings → General → Danger zone → Change visibility**.

---

## Step 2 — GitHub CLI (gh) readiness

### Verified

- **Auth:** Logged in to `github.com` as user **cboteros** (keyring).
- **Scopes:** `repo`, `workflow`, `read:org`, `gist`.
- **Repo access:** `gh repo view` succeeded (name, owner, defaultBranchRef, visibility, viewerPermission).

### If another agent or machine is not logged in

**You must run:**

```bash
gh auth login
```

- Choose **GitHub.com**.
- Prefer **HTTPS** (recommended for most setups).
- Choose **Login with a web browser** and complete the flow (safest; no token paste), or **Paste an authentication token** if you use a fine‑grained or classic token.
- Do not commit or share tokens.

---

## Step 3 — Repository security best practices

| Practice | Status | Notes |
|----------|--------|--------|
| **Branch protection** | ⚠️ Not verifiable from repo | Rules are configured in GitHub UI. Docs exist: [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md), [GITHUB_ENTERPRISE_SETUP.md](GITHUB_ENTERPRISE_SETUP.md). You must apply the rule for `main` in **Settings → Branches**. |
| **Pull request workflow** | ✅ Supported | CI runs on PRs to main, staging, dev, feature/*, hotfix/*. Merge to main should be via PR only once branch protection is enabled. |
| **Required status checks** | ⚠️ Depends on branch protection | CI job name: `lint-and-build`. In the branch protection rule for `main`, add required status check: **lint-and-build** (or **CI / lint-and-build**). |
| **Dependabot** | ✅ Present | `.github/dependabot.yml`: npm (weekly Monday) and github-actions, groups for minor/patch, labels `dependencies`. |
| **Security policy** | ✅ Present | `SECURITY.md`: report via email or private contact; no public issues for vulns; good practices. Replace placeholder email with a real security contact. |
| **Contributing guide** | ✅ Present | `CONTRIBUTING.md`: workflow, verify before PR, no secrets, docs. |
| **Issue templates** | ✅ Present | `.github/ISSUE_TEMPLATE/`: Bug, Feature; `config.yml` with contact links. |
| **PR template** | ✅ Present | `.github/pull_request_template.md`: description, type, checklist (lint, test, build, docs, no secrets, migrations). |
| **Code owners** | ⚠️ Placeholder | `.github/CODEOWNERS` exists but only has a commented line. Add e.g. `* @cloudsysops/team-name` or `* @user1 @user2` when you have a team or list of owners. |

### Recommendations

1. **Branch protection for `main`:** In GitHub **Settings → Branches → Add rule** (pattern `main`): require a pull request, require status check **lint-and-build**, require branch up to date, do not allow bypassing. Optionally require 1 approval.
2. **SECURITY.md:** Replace the placeholder security contact email with a real address (or state “Open an issue and tag maintainers” if you prefer).
3. **CODEOWNERS:** Uncomment and set a team or usernames so PRs can require review from code owners if desired.

---

## Step 4 — Branch strategy

### Option A (recommended for this project): main + feature branches

- **Single protected branch:** `main` (deploy to Vercel).
- Work in **feature/*** or **hotfix/***; merge into `main` only via PR with CI green.
- **Pros:** Simple, fewer merge conflicts, one source of truth, matches current “one Vercel project from main” setup. Safer for a small team or MVP.
- **Cons:** No dedicated staging branch in the repo (you can still use Vercel Preview branches for PRs).

### Option B: dev → staging → main

- Three branches; flow feature → dev → staging → main.
- **Pros:** Clear staging environment if you use it.
- **Cons:** More process and merge overhead; only worth it if you actually use staging and multiple environments.

### Recommendation

Use **Option A (main + feature branches)** for this SaaS at this stage. Keep the MVP stable and deploy from `main`. Add staging later if you introduce a separate staging environment and need it in GitHub.

---

## Step 5 — GitHub Actions (CI)

### File reviewed

`.github/workflows/ci.yml`

### Coverage

| Step | Present | Notes |
|------|--------|--------|
| **Install** | ✅ | `npm ci` |
| **Lint** | ✅ | `npm run lint` |
| **Test** | ✅ | `npm run test` |
| **Build** | ✅ | `npm run build` (with placeholder env for build) |
| **Env shape validation** | ✅ | `./scripts/env_check.sh` with placeholder env vars |

### Triggers

- Push and pull_request to: `main`, `staging`, `dev`, `feature/**`, `hotfix/**`.
- `workflow_dispatch` for manual run.

### Conclusion

CI is in good shape for a professional SaaS: install, lint, test, env check, build. Nothing critical missing for the current MVP. Optional future additions: deploy job (e.g. to Vercel) from GitHub Actions, or a separate “deploy” workflow; not required if you deploy only from Vercel’s Git integration.

---

## Step 6 — gh CLI commands (for reference only — do not run automatically)

Use these when you need to inspect or configure; auth may be required.

### Branch protection (apply in UI; these are read-only or require API)

```bash
# List branch protection rules (API)
gh api repos/cloudsysops/smile-transformation-platform-/branches/main/protection

# View repo settings
gh repo view cloudsysops/smile-transformation-platform- --web
```

### Repo configuration

```bash
gh repo view --json name,owner,defaultBranchRef,visibility,viewerPermission
gh repo view cloudsysops/smile-transformation-platform-
```

### Workflows

```bash
gh workflow list
gh run list --workflow=ci.yml --limit 5
```

### Secrets (list only; values never shown)

```bash
gh secret list
```

### Pull requests and issues

```bash
gh pr list --state open
gh pr list --state all --limit 10
gh issue list --state open
gh issue list --state all --limit 10
```

### Auth (if needed)

```bash
gh auth status
gh auth login
```

---

## Step 7 — Final output summary

### 1. GitHub connection status

**OK.** Remote points to `cloudsysops/smile-transformation-platform-.git`; default branch `main`; viewer has ADMIN; repo is PUBLIC.

### 2. gh CLI readiness

**OK on this machine.** Logged in as cboteros with sufficient scopes. On other machines or for other users, run **`gh auth login`** (see Step 2).

### 3. Repo security maturity

| Area | Status |
|------|--------|
| Docs and templates | ✅ PR template, issue templates (Bug, Feature), SECURITY.md, CONTRIBUTING.md, branch protection docs. |
| Dependabot | ✅ Configured for npm and GitHub Actions. |
| CODEOWNERS | ⚠️ Placeholder only; add team or usernames when ready. |
| Branch protection | ⚠️ Must be configured in GitHub UI (see §3). |
| Security contact | ⚠️ Replace placeholder in SECURITY.md with real contact. |

### 4. Branch strategy recommendation

**main + feature branches (Option A).** One protected `main`; all changes via PR; CI required. Add staging branch later if you need a dedicated staging flow.

### 5. CI/CD readiness

**Ready.** Workflow runs install, lint, test, env_check, build. Job name `lint-and-build` is the one to require in branch protection for `main`.

### 6. Commands you must run manually (when needed)

| Purpose | Command |
|--------|--------|
| Log in to GitHub (other machine or user) | `gh auth login` |
| Open repo settings in browser | `gh repo view cloudsysops/smile-transformation-platform- --web` |
| List workflows / runs | `gh workflow list` ; `gh run list --workflow=ci.yml` |
| List open PRs / issues | `gh pr list` ; `gh issue list` |

### 7. Configuration that must be done in GitHub UI

- **Branch protection for `main`:** Settings → Branches → Add rule → Branch name pattern `main` → Require pull request, require status check **lint-and-build**, require branch up to date, do not allow bypassing. Optionally require 1 approval.
- **SECURITY.md:** Replace placeholder security contact (e.g. email) in the repo file and commit.
- **CODEOWNERS:** Edit `.github/CODEOWNERS` to add real owners (e.g. `* @cloudsysops/team` or `* @user1`) and commit.
- **Visibility:** If you want the repo private, Settings → General → Change visibility.
- **Description / features:** Settings → General → Description; enable Issues, Pull requests, Preserve repository as needed.

### 8. Enterprise-ready or not?

**Nearly enterprise-ready.** The repo has:

- Correct connection and default branch.
- CI (install, lint, test, build, env check).
- PR and issue templates, SECURITY.md, CONTRIBUTING.md, Dependabot, and documentation for branch protection and workflow.

To be fully enterprise-ready you should:

1. Apply branch protection for `main` in the GitHub UI.
2. Set a real security contact in SECURITY.md.
3. Optionally complete CODEOWNERS and, if desired, switch to a private repo.

No codebase changes were made in this audit; only analysis and recommendations.
