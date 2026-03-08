# Tooling stack — Nebula Smile

Professional foundation stack for development, testing, deployment, and future scaling. Classified by support level; no credentials are stored in the repo.

---

## Core development tools

| Tool | Status | Purpose | Auth / notes |
|------|--------|--------|--------------|
| **git** | Supported | Version control | Use existing SSH/HTTPS |
| **GitHub CLI (gh)** | Supported | PRs, repo access | **You must run:** `gh auth login` |
| **node** | Supported | Runtime (LTS 20 recommended) | — |
| **npm** | Supported | Dependencies, scripts | — |
| **docker** | Supported | Local Supabase, Kafka, services | — |
| **docker compose** | Supported | Multi-container stacks | — |
| **Supabase CLI** | Supported | Local DB, migrations, link | **You must run:** `supabase login` (install: `brew install supabase/tap/supabase`) |
| **Vercel CLI** | Supported | Deploy, preview | **You must run:** `vercel login` |
| **Stripe CLI** | Supported | Local webhook forwarding | **You must run:** `stripe login` |
| **Terraform** | Supported | Infra-as-code (structure only; no provision yet) | Credentials when you add providers |

---

## Optional / planned

| Tool | Status | Purpose | Notes |
|------|--------|--------|--------|
| **Kafka (Docker)** | Partially supported | Event-driven features | `docker-compose.kafka.yml`; see [KAFKA_LOCAL_SETUP.md](KAFKA_LOCAL_SETUP.md). Not required for app startup. |
| **n8n** | Not in repo | Workflow automation | Add later if needed. |
| **Sentry** | Documented | Error monitoring | Placeholder in .env.example; add when integrating. |
| **Tailscale** | Not in repo | Private networking | Add later if needed. |
| **Portainer** | Not in repo | Docker UI | Add later if needed. |
| **Ollama** | Not in repo | Local LLM | Add later if needed. |

---

## Repo foundation (scripts and docs)

| Item | Status |
|------|--------|
| **Makefile** | Present — bootstrap, dev, dev-up, dev-down, down, verify, check-env, lint, test, build, clean |
| **scripts/bootstrap.sh** | Present — tool check, deps, env |
| **scripts/check_env.sh** | Present — required/optional env validation |
| **scripts/dev_up.sh** | Present — start local stack |
| **scripts/dev_down.sh** | Present — stop local stack |
| **scripts/verify_all.sh** | Present — lint + test + build (used by CI) |
| **scripts/deploy_verify.sh** | Present — verify deployed URL (health, landing) |
| **scripts/env_check.sh** | Present — CI env shape validation |
| **docs/LOCAL_SETUP.md** | Present |
| **docs/TOOLING_AUDIT.md** | Present — install vs missing, login commands |
| **docs/ENVIRONMENT_STRATEGY.md** | Present — required vs optional, groups |
| **docs/SUPABASE_SETUP.md** | Present |
| **docs/VERCEL_SETUP.md** | Present |
| **docs/STRIPE_LOCAL_SETUP.md** | Present |
| **docs/GIT_AND_GITHUB_WORKFLOW.md** | Present |

---

## Commands you must run manually (auth)

Do not commit tokens or credentials. Run these when you need the tool:

| Tool | Exact command |
|------|----------------|
| GitHub CLI | `gh auth login` |
| Supabase CLI | `supabase login` |
| Vercel CLI | `vercel login` |
| Stripe CLI | `stripe login` |

Supabase CLI install (if missing): `brew install supabase/tap/supabase` then `supabase login`.

---

## References

- [LOCAL_SETUP.md](LOCAL_SETUP.md) — quick start and Makefile
- [TOOLING_AUDIT.md](TOOLING_AUDIT.md) — detailed audit
- [ENVIRONMENT_STRATEGY.md](ENVIRONMENT_STRATEGY.md) — env vars and strategy
