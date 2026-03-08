# Curated Private Network Foundation

Nebula Smile is **not an open marketplace**. It is a **curated private network** of trusted providers, specialists, and partners.

---

## Business rules

- **Only admins** can create providers, specialists, experiences, and packages.
- New providers or specialists enter **only by recommendation** (invited_by_provider_id / recommended_by_provider_id).
- The platform preserves a **family-oriented, high-quality, professional** network.
- **There is no public provider signup flow.**

---

## Design principles

| Principle | Implementation |
|-----------|----------------|
| Curated, not open | All provider/specialist creation and approval is admin-only. RLS enforces admin write. |
| Invite / recommend | Providers have `invited_by_provider_id`; specialists have `recommended_by_provider_id`. |
| Approval before visibility | `approval_status` (pending | approved | rejected). Public-facing catalog shows only approved. |
| Family network flag | `providers.is_family_network` marks core trusted partners. |
| Internal notes | `providers.internal_notes` — admin-only, never exposed to public. |

---

## What is implemented now vs later

### Implemented now (schema + app layer)

- **Migration 0009:** New columns on `providers` and `specialists` (invited_by, approved_by, approval_status, is_family_network, internal_notes; specialists: recommended_by_provider_id, approval_status).
- **RLS:** Unchanged — only admins can insert/update/delete providers and specialists.
- **Application layer:** `getPublishedSpecialists()` and public use of providers filter by `approval_status = 'approved'`. `getApprovedProviders()` for public catalog. Admin uses `getProviders()` with full fields.
- **Docs:** DATA_MODEL.md and this doc describe the curated-network model. No public onboarding flows exist or are planned.

### Implemented later (optional)

- **Admin UI:** Screens to create/edit providers and specialists, set approval_status, invited_by, internal_notes, is_family_network. (Today admin can do this via Supabase Dashboard or API if built.)
- **Approval workflow UI:** List of pending providers/specialists, “Approve” / “Reject” actions, optional approved_by audit.
- **Experiences/packages:** Same idea can be extended (e.g. approval_status, created_by) if the team wants full curation of every catalog entity.

---

## Why this supports quality and trust

1. **No open signup** — Patients see only partners that the platform has explicitly invited and approved.
2. **Recommendation chain** — Every provider/specialist can be traced to who invited or recommended them, keeping the network accountable.
3. **Single point of control** — Admins decide who is in the network and who is published; no race to fill the catalog with unvetted listings.
4. **Family-oriented positioning** — `is_family_network` and careful curation support a “trusted, professional, family-friendly” brand rather than a generic directory.

---

## Relation to “marketplace” docs

The **Marketplace Foundation** (migrations 0007–0008) introduced providers, package types, bookings, and links between entities. That foundation is **reused** here: the same tables now support a **curated** model. Think of it as:

- **Marketplace foundation** = data model (providers, packages, specialists, experiences, bookings).
- **Curated network foundation** = who can create/approve and how (admin-only, approval_status, invite/recommend fields). No change to public signup — there is none.

See also: [DATA_MODEL.md](DATA_MODEL.md), [SPRINT_MARKETPLACE_FOUNDATION.md](SPRINT_MARKETPLACE_FOUNDATION.md).
