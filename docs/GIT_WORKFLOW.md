# Git Workflow — Nebula Smile

This repository follows a startup-grade branch model designed for speed and launch safety.

## Official branch model

| Branch | Role | Deployment target | Push policy |
|---|---|---|---|
| `main` | Production-stable code only | Production | No direct push |
| `staging` | Pre-production validation | Staging/Preview | PR only |
| `dev` | Active integration branch | Dev preview | PR preferred |
| `feature/*` | Short-lived feature work | Optional preview | PR into `dev` |
| `hotfix/*` | Emergency production fixes | High-priority preview | PR into `main` + back-merge |

## Branch usage rules

1. Create all product/code changes in `feature/*` branches from `dev`.
2. Merge `feature/*` -> `dev` after CI green + review.
3. Promote `dev` -> `staging` for release-candidate validation.
4. Promote `staging` -> `main` for production release.

## Pull request flow

### Feature work

1. Branch from `dev`:
   - `git checkout dev`
   - `git pull --ff-only origin dev`
   - `git checkout -b feature/<short-scope-name>`
2. Open PR to `dev`.
3. Required checks:
   - Lint
   - Tests
   - Build
4. Squash merge (recommended).

### Hotfix flow

1. Branch from `main`:
   - `git checkout main`
   - `git pull --ff-only origin main`
   - `git checkout -b hotfix/<incident-or-ticket>`
2. Open PR to `main` with high priority.
3. After merge to `main`, back-merge:
   - `main` -> `staging`
   - `staging` -> `dev`

## Branch deletion policy

- Delete `feature/*` after merge.
- Delete `hotfix/*` after merge and back-merge completion.
- Keep `dev`, `staging`, `main` permanently.

## Merge policy

- No force-push on shared branches (`dev`, `staging`, `main`).
- Keep commits atomic and descriptive.
- Prefer PRs with:
  - Scope summary
  - Risk notes
  - Test evidence
