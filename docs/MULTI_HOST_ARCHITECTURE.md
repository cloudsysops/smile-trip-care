## Multi-host Marketplace Architecture

### Why hosts are a separate entity

- `profiles` describe **users** (patients, admins, specialists, coordinators).
- `hosts` describe **supply-side partners** who provide:
  - lodging (family-hosted stays, fincas, apartments)
  - transport (airport pickup, inter-city transfers)
  - tours and local experiences
  - meals and hospitality
- A single user profile can be both:
  - a patient (consuming services) and
  - a host (offering services) over time.

Separating `hosts` from `profiles` keeps the auth/session model simple while allowing future:

- host dashboards
- revenue tracking per host
- payouts and financial reporting

### Core relationships

- `profiles` (users)  
  ↕ (1:1)  
- `hosts` (supply partners)

- `hosts` (1)  
  ↕ (1:N)  
- `experiences` (lodging, tours, transport, meals, clinic-adjacent services)

- `packages`  
  ↕ (N:M via `package_experiences`)  
- `experiences`

This allows a package to aggregate experiences from multiple hosts (multi-host packages) while still attributing each experience to a specific host entity for future dashboards and payouts.

### Existing flows preserved

- Auth (Supabase), profiles, multi-role (profile_roles / active_role).
- Leads, bookings, payments, Stripe checkout, and webhook.
- Package builder and marketplace UI.

The `hosts` model is entirely additive:

- `experiences.host_id` is nullable.
- Legacy experiences without a host continue to work.

