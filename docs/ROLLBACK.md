# Rollback Runbook

Use this runbook when a production deployment introduces regressions.

## 1) Identify last known good release

- Open GitHub Actions for `main`.
- Find last successful run before the incident.
- Copy the commit SHA.

## 2) Roll back application code

Option A (preferred): deploy previous commit SHA from hosting dashboard.

Option B (git-based rollback):

```bash
git checkout main
git pull --rebase origin main
git revert <bad_commit_sha>
git push origin main
```

> Use revert (not force push) to preserve history.

## 3) Roll back environment variables

If the issue is config-related:

- Revert recent env var changes in the hosting dashboard.
- Redeploy from last known good commit.

## 4) Stripe incident rollback

- If webhook processing is problematic, temporarily disable webhook endpoint in Stripe dashboard.
- Verify no duplicate checkout completion processing is happening.
- Re-enable webhook after fix is deployed.

## 5) Database rollback strategy

- Avoid destructive rollback in production unless strictly required.
- Prefer forward-fix migrations.
- If a migration caused breakage:
  - Put app in maintenance mode (if needed).
  - Apply corrective migration.
  - Validate `/api/health/ready` before reopening traffic.

## 6) Validation after rollback

```bash
curl -s https://<your-domain>/api/health
curl -s https://<your-domain>/api/health/ready
```

Then test:

- Lead creation flow
- Admin login and lead listing
- Stripe checkout + webhook

## 7) Postmortem checklist

- Capture root cause.
- Add regression test.
- Update this runbook if process gaps were found.
