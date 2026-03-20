# Curated Network Workflow

This document describes how the **private curated medical tourism network** works from creation to public visibility.

---

## Principles

- **No open marketplace.** Only admins create providers, specialists, experiences, and packages.
- **Entry by invitation/recommendation.** Providers have `invited_by_provider_id`; specialists have `recommended_by_provider_id`.
- **Approval before visibility.** Entities use `approval_status` and (where applicable) `published`. Public catalog shows only approved + published.
- **Family-oriented, high-quality.** The network is curated for trust and professionalism.

---

## Entity lifecycle

### Providers

1. **Create:** Admin creates via admin API (`POST /api/admin/providers`) or Supabase. No public signup.
2. **Fields:** `name`, `slug`, `provider_type`, `city`, `country`, `description`, contact info, `invited_by_provider_id`, `is_family_network`, `internal_notes`, `approval_status` (default `pending`), `published` (default `false`).
3. **Approve:** Admin sets `approval_status = 'approved'` and optionally `approved_by` (profile id).
4. **Publish:** Admin sets `published = true` so the provider appears in the public catalog. RLS allows public SELECT only when `published = true` and `approval_status = 'approved'`.
5. **Suspend:** Admin can set `approval_status = 'suspended'` to hide without deleting.

### Specialists

1. **Create:** Admin creates via `POST /api/admin/specialists`. Linked to a provider via `provider_id`; optional `recommended_by_provider_id`.
2. **Approve:** Admin sets `approval_status = 'approved'`.
3. **Publish:** Admin sets `published = true`. Public catalog shows only `published = true` and `approval_status = 'approved'`.

### Experiences

1. **Create:** Admin creates via `POST /api/admin/experiences`. Linked to provider via `provider_id`.
2. **Publish:** Admin sets `published = true`. No separate approval_status; visibility is gated by `published` and RLS.

### Packages

1. **Create/update:** Admin only. Packages have `provider_id`, `package_type`, `title`, `subtitle`, `origin_city`, `destination_city`, `price_from_usd`, `highlights`, `includes`, `excludes`, `published`.
2. **Relations:** Admin manages `package_experiences` and `package_specialists` (junction tables) to link packages to experiences and specialists.
3. **Public read:** RLS allows SELECT only when `published = true`.

---

## Admin-only APIs

| Route | Purpose |
|-------|--------|
| `GET/POST /api/admin/providers` | List all providers; create provider. |
| `GET/PATCH /api/admin/providers/[id]` | Get/update one provider. |
| `GET/POST /api/admin/specialists` | List all specialists; create specialist. |
| `GET/PATCH /api/admin/specialists/[id]` | Get/update one specialist. |
| `GET/POST /api/admin/experiences` | List all experiences; create experience. |
| `GET/PATCH /api/admin/experiences/[id]` | Get/update one experience. |
| `GET/PATCH /api/admin/packages/[id]` | Get package with relations; update package. |
| `GET/POST /api/admin/consultations` | List/create consultations. |
| `GET/PATCH /api/admin/consultations/[id]` | Get/update consultation. |
| `GET/POST /api/admin/bookings` | List/create bookings. |
| `GET/PATCH /api/admin/bookings/[id]` | Get/update booking. |

All require `requireAdmin()` (session + `profiles.role = 'admin'`). Validation is Zod; errors return 400 with `request_id`.

---

## Public visibility summary

| Entity | Public sees |
|--------|-------------|
| Providers | `published = true` and `approval_status = 'approved'` |
| Specialists | `published = true` and `approval_status = 'approved'` |
| Experiences | `published = true` |
| Packages | `published = true` |
| package_experiences / package_specialists | Read-only; used to show package composition. |

See [DATA_MODEL.md](DATA_MODEL.md) and [CURATED_NETWORK_FOUNDATION.md](CURATED_NETWORK_FOUNDATION.md).
