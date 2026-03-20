# Git and GitHub workflow

Verification and branch workflow for Nebula Smile. **No GitHub settings are changed by this doc** — configure branch protection and rules in the repo Settings when approved.

---

## Git remote

- **origin:** Points to the GitHub repository (e.g. `https://github.com/cloudsysops/smile-transformation-platform-.git`).
- Verify: `git remote -v`

---

## Branch strategy

| Branch | Purpose |
|--------|--------|
| **main** | Production. Deploy from here. Protect with PR + CI. |
| **staging** | Pre-production (optional). |
| **dev** | Integration (optional). |
| **feature/\*** | Short-lived; merge into main or staging via PR. |
| **hotfix/\*** | Urgent fixes; merge into main via PR. |

Default branch is typically **main**. CI runs on push/PR to main, staging, dev, feature/*, hotfix/* (see `.github/workflows/ci.yml`).

---

## Branch protection policy (summary)

For this repo, the **recommended minimal policy** is:

- **Protected branch:** `main`
- **PR required** to merge into `main` (no direct pushes)
- **Minimum approvals:** 1
- **Required checks:**
  - `CI / lint-and-build` (verify: lint + test + build + env_check)
  - `security / secret-scan` (TruffleHog secret scan)
- **Require branches to be up to date before merging**

Details and step-by-step UI instructions: [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md) and [GITHUB_GOVERNANCE_FINAL.md](GITHUB_GOVERNANCE_FINAL.md).

---

## GitHub CLI (gh)

### Verify auth

```bash
gh auth status
```

If not logged in:

```bash
gh auth login
```

Follow prompts (browser or token). Required scopes for this repo: `repo`, `workflow`.

### Repo access

- **Read:** Clone, pull, list PRs.
- **Write:** Push, create PRs, merge (if permitted by branch protection).

Check: `gh repo view` (from repo root).

### Typical workflow

1. Create branch: `git checkout -b feature/my-feature`
2. Commit and push: `git push -u origin feature/my-feature`
3. Open PR: `gh pr create` or via GitHub UI.
4. After CI passes and review: merge via UI or `gh pr merge`.

**Do not change** branch protection rules, required status checks, or approval requirements unless explicitly approved.

---

## References

- [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md) — how to protect main/staging
- [GITHUB_ENTERPRISE_SETUP.md](GITHUB_ENTERPRISE_SETUP.md) — broader GitHub setup
- [CONTRIBUTING.md](../CONTRIBUTING.md) — contribution and verify-before-merge
