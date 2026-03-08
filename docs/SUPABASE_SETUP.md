# Supabase setup — Nebula Smile

Database, Auth, and local/remote Supabase usage. **No credentials are created by scripts.** Login and project linking require your manual action.

---

## Supabase CLI

### Install

- **macOS:** `brew install supabase/tap/supabase`
- **Other:** [Supabase CLI docs](https://supabase.com/docs/guides/cli)

### Login (required for link and migrations via CLI)

**You must run:**

```bash
supabase login
```

This opens the browser to authenticate. Do not commit any tokens.

---

## Project linking (remote project)

After creating a project in [app.supabase.com](https://app.supabase.com):

```bash
# From repo root
cd smile-transformation-platform

# Link to your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF
```

Project ref is in Supabase Dashboard → Project Settings → General → Reference ID.

---

## Migrations

### Order

Apply in lexicographic order. Full list: [supabase/migrations/MIGRATION_ORDER.md](../supabase/migrations/MIGRATION_ORDER.md).

1. `0001_init.sql` through `0020_leads_recommended_package.sql`
2. Optionally: `scripts/seed_packages.sql`, `scripts/seed_marketplace_foundation.sql`

### Apply migrations (after link)

**Option A — CLI (recommended when linked):**

```bash
# From repo root
npm run db:migrate
# or
npx supabase db push
```

**Option B — SQL Editor (no CLI link):**

1. Supabase Dashboard → SQL Editor.
2. Run each file in `supabase/migrations/` in order (0001 → 0020).
3. Run seed scripts if needed.

### Repair (if migrations were applied manually)

If you applied migrations manually or renamed files:

```bash
npx supabase migration repair <migration_name> --status applied
```

---

## Local Supabase (optional)

Requires Docker and Supabase CLI.

```bash
supabase login   # if not already
supabase start   # starts local Postgres, Auth, Studio
supabase status  # shows API URL and keys for .env.local
supabase stop    # stop local stack
```

Use `scripts/dev_up.sh` / `scripts/dev_down.sh` to start/stop local Supabase.

---

## Environment variables (app)

After project is created (remote or local), set in `.env.local`:

| Variable | Where to get it |
|----------|-----------------|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role (Reveal) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public (Reveal) |

For local runs: use output of `supabase status` (API URL and anon/service_role keys).

---

## Safe practices

- Do not commit `.env.local` or service_role key.
- Migrations are additive where possible; test in dev first.
- First admin user: create in Dashboard → Authentication → Users, then insert/update `public.profiles` with `role = 'admin'` (see [CONECTAR_SUPABASE_VERCEL.md](CONECTAR_SUPABASE_VERCEL.md) or project docs).
