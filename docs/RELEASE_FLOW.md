# Release Flow — dev -> staging -> main

This release process is optimized for fast startup iteration with production safety.

## Deployment mapping

| Branch | Deployment target | Purpose |
|---|---|---|
| `dev` | Development preview | Integration and team testing |
| `staging` | Staging environment | Release candidate validation |
| `main` | Production | Real user traffic and sales |

## CI/CD baseline

GitHub Actions CI must run on:

- Pull requests to `dev`, `staging`, `main`
- Pushes to `feature/*`, `hotfix/*`, `dev`, `staging`, `main`

Required checks:

1. `npm run lint`
2. `npm run test`
3. `npm run build`

Recommended pre-merge checks:

- `./scripts/env_check.sh` with deployment env set
- Smoke test checklist from `docs/PRODUCTION_LAUNCH_CHECKLIST.md`

## Branch protection recommendations

Reference: see `docs/BRANCH_PROTECTION_SETUP.md` for exact GitHub UI settings.

## `main`

- Require PR before merge
- Require status checks (CI)
- Require up-to-date branch before merge
- Disable direct pushes

## `staging`

- Require PR before merge
- Require status checks (CI)
- Restrict direct pushes

## `dev`

- PR preferred (can allow maintainers direct merge if needed)
- Status checks recommended
- Keep branch as integration source of truth

## Standard release lifecycle

1. `feature/*` -> `dev`
2. Validate in dev environment
3. `dev` -> `staging`
4. Execute staging smoke tests
5. `staging` -> `main`
6. Monitor production logs and health endpoints

## Safe adoption plan for existing repository

Apply once to migrate from ad-hoc flow to structured flow:

```bash
# 1) Start from up-to-date main
git checkout main
git pull --ff-only origin main

# 2) Create persistent integration branches
git checkout -b dev
git push -u origin dev

git checkout main
git checkout -b staging
git push -u origin staging

# 3) Return to main
git checkout main
```

Then configure GitHub branch protections (`main`, `staging`, `dev`) and Vercel branch-to-environment mapping.

## Hotfix release path

```bash
git checkout main
git pull --ff-only origin main
git checkout -b hotfix/<incident-id>
# implement + test
git push -u origin hotfix/<incident-id>
```

After merge to `main`, back-merge:

1. `main` -> `staging`
2. `staging` -> `dev`

This prevents regression drift between environments.
