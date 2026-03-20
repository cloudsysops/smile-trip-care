## Host role and experience ownership

### Role model

- Existing roles remain:
  - `admin`, `coordinator`, `provider_manager`, `specialist`, `patient`, `user`.
- This sprint extends the allowed role values to also include:
  - `host`

Multi-role is handled by:

- `profile_roles` (multi-assignable roles per profile)
- `profiles.role` (primary legacy role)
- `profiles.active_role` (for future context switching)

The `host` role:

- Identifies profiles that may operate as supply-side partners.
- Does not change auth/session behavior.
- Does not grant admin privileges by itself.

### Host entity model

- Table: `public.hosts`
  - `id uuid primary key default gen_random_uuid()`
  - `profile_id uuid not null references public.profiles(id) on delete cascade`
  - `display_name text not null`
  - `city text`
  - `bio text`
  - `phone text`
  - `whatsapp text`
  - `is_active boolean not null default true`
  - `created_at timestamptz not null default now()`
- Constraint:
  - `unique(profile_id)` — a profile has at most one host record.

### Experience ownership model

- Table: `public.experiences` (extended)
  - `host_id uuid references public.hosts(id) on delete set null`
- Semantics:
  - `host_id` points to the host that "owns" or operates the experience.
  - `host_id null` is allowed and expected for:
    - legacy experiences
    - centrally managed or system-owned items

### Family-hosted use case

Examples:

- A Medellín family host:
  - `hosts` row with `display_name = 'Family Host Medellín'`, `city = 'Medellín'`.
  - `experiences` such as:
    - "Family-hosted lodging Medellín"
    - "Meals included"
  - These experiences set `host_id` to the host.

- A Manizales finca host:
  - `hosts` row for the finca family.
  - `experiences` like:
    - "Luxury finca Manizales"
    - "Coffee tour Manizales"

In both cases:

- Packages combine experiences from one or multiple hosts.
- Future dashboards can slice bookings/revenue by `host_id` without changing the booking or payment flows today.

