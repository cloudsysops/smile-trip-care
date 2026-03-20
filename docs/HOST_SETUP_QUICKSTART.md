## Host setup quickstart

This guide explains how to promote an internal user to `host`, create a host record, and assign experiences to that host.

> ⚠️ All steps assume you have admin access to the Supabase project and this repo.

### 1. Ensure the profile can act as `host`

Roles are managed through:

- `profiles.role` (primary role)
- `profile_roles` (multi-role)

To mark a profile as a host (example by email):

```sql
update public.profiles
set role = 'host'
where email = 'host@example.com';
```

Optionally add a row in `profile_roles`:

```sql
insert into public.profile_roles (profile_id, role, is_active)
select id, 'host', true
from public.profiles
where email = 'host@example.com'
on conflict do nothing;
```

### 2. Create a host row

Create a `hosts` entry tied to the profile:

```sql
insert into public.hosts (profile_id, display_name, city, bio, phone, whatsapp)
select id,
       'Family Host Medellín',
       'Medellín',
       'Curated family-hosted stay for dental travelers in Medellín.',
       '+57 300 000 0000',
       '+57 300 000 0000'
from public.profiles
where email = 'host@example.com'
on conflict (profile_id) do nothing;
```

### 3. Assign experiences to the host

Use existing experience names or create new ones, then assign `host_id`:

```sql
update public.experiences
set host_id = (
  select id from public.hosts
  where profile_id = (select id from public.profiles where email = 'host@example.com')
)
where name in (
  'Family-hosted lodging Medellín',
  'Meals included'
);
```

### 4. Verify in debug pages

1. Sign in as the promoted user.
2. Visit `/debug/auth`:
   - Confirm:
     - Active role includes `host` (if configured in `profile_roles`).
     - Host section shows `host profile active`, `display_name`, `city`, `whatsapp`.
3. As admin, visit `/debug/roles`:
   - Look for the profile row:
     - `Role` and `Multi-roles` columns should include `host` if set.
     - `Host` column should show `host active`.

If any of these steps fail, double-check:

- That migrations `0026_multi_host_foundation.sql` have been applied.
- That the SQL statements above ran in the correct Supabase project.

