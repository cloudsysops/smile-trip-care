# Local setup — Nebula Smile

Professional local development setup. Non-destructive; no credentials are created by scripts.

---

## Quick start

```bash
# From repo root
cd smile-transformation-platform

# 1. Bootstrap (checks tools, deps, env)
./scripts/bootstrap.sh
# or: make bootstrap

# 2. Copy env and fill required values
cp .env.example .env.local
# Edit .env.local — see "Environment variables" below

# 3. Validate env
./scripts/check_env.sh
# or: make check-env

# 4. Start app
npm run dev
# App: http://localhost:3000
```

---

## Required tools

| Tool | Purpose | Install |
|------|--------|--------|
| **git** | Version control | Built-in / Xcode CLI / package manager |
| **node** (LTS 20.x recommended) | Runtime | [nodejs.org](https://nodejs.org) or nvm |
| **npm** | Dependencies | Bundled with Node |

---

## Optional tools

| Tool | Purpose | Install |
|------|--------|--------|
| **Docker** | Local Supabase / Kafka | [docker.com](https://docker.com) |
| **Supabase CLI** | Local DB, migrations | `brew install supabase/tap/supabase` then `supabase login` |
| **gh** | GitHub PR/workflow | `brew install gh` then `gh auth login` |
| **vercel CLI** | Deploy from CLI | `npm i -g vercel` then `vercel login` |
| **stripe CLI** | Local webhook testing | [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) then `stripe login` |
| **terraform** | Infra-as-code | [terraform.io](https://terraform.io) |

See [TOOLING_AUDIT.md](TOOLING_AUDIT.md) for audit and manual login commands.

---

## Environment variables

- **Source:** Copy `.env.example` to `.env.local`. Never commit `.env.local`.
- **Required for run:** See `.env.example` sections "App", "Supabase", "Stripe". Also [ENV_Y_STRIPE.md](ENV_Y_STRIPE.md).
- **Validation:** `./scripts/check_env.sh` or `make check-env`.

---

## Makefile targets

From repo root:

| Target | Description |
|--------|-------------|
| `make help` | List targets |
| `make install` | npm ci |
| `make bootstrap` | Run bootstrap.sh |
| `make check-env` | Validate env vars |
| `make dev` | Start Next.js dev server (npm run dev) |
| `make dev-up` | Start local stack (Supabase/Docker) |
| `make dev-down` / `make down` | Stop local stack |
| `make verify` | lint + test + build |
| `make lint` | npm run lint |
| `make test` | npm run test |
| `make build` | npm run build |

---

## Scripts

| Script | Purpose |
|--------|--------|
| `scripts/bootstrap.sh` | First-time / periodic setup check |
| `scripts/check_env.sh` | Validate required/optional env vars |
| `scripts/verify_all.sh` | lint + test + build (used by CI and make verify) |
| `scripts/dev_up.sh` | Start Docker/Supabase for local dev |
| `scripts/dev_down.sh` | Stop local Supabase |
| `scripts/env_check.sh` | CI-oriented env check (same idea as check_env.sh) |
| `scripts/deploy_verify.sh <URL>` | Verify deployed app (health, ready) |
| `scripts/run_migrations.sh` | Apply Supabase migrations (requires link) |

---

## Branch workflow

- **main** — production-ready; protected by PR + CI.
- **staging** / **dev** — integration branches (if used).
- **feature/** — short-lived branches; merge via PR into main or staging.

See [BRANCH_PROTECTION_SETUP.md](BRANCH_PROTECTION_SETUP.md) and [GITHUB_ENTERPRISE_SETUP.md](GITHUB_ENTERPRISE_SETUP.md).

---

## Further docs

- [TOOLING_AUDIT.md](TOOLING_AUDIT.md) — tools installed vs missing
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) — DB and migrations
- [VERCEL_SETUP.md](VERCEL_SETUP.md) — deploy and env
- [STRIPE_LOCAL_SETUP.md](STRIPE_LOCAL_SETUP.md) — local webhooks
- [KAFKA_LOCAL_SETUP.md](KAFKA_LOCAL_SETUP.md) — optional Kafka with Docker
