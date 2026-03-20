# Brand audit — Rebrand to MedVoyage Smile

**Date:** 2026-03  
**Current brand:** Nebula Smile / Nebula Nexus / Smile Transformation Platform  
**Target brand:** MedVoyage Smile  

---

## 1. Files with visible branding references (user-facing)

### Central source (update first)
| File | Reference |
|------|------------|
| `lib/branding.ts` | `productName: "Nebula Smile"`, `companyName: "Nebula Nexus"`, `tagline` |

### App — use `branding.*` (auto-updated when lib/branding.ts changes)
| File | How used |
|------|----------|
| `app/page.tsx` | Header, footer "A {companyName} company", testimonial quote, alt text, trust copy |
| `app/assessment/page.tsx` | Back link |
| `app/thank-you/page.tsx` | Back link, thank-you copy |
| `app/login/page.tsx` | Header link |
| `app/patient/page.tsx` | Header |
| `app/packages/page.tsx` | Back link, footer "A {companyName} company" |
| `app/packages/[slug]/page.tsx` | Back link, support copy |
| `app/dental-implants-colombia/page.tsx` | Header, hero copy, "Why {productName}" section |
| `app/veneers-colombia/page.tsx` | Header, hero copy, "Why {productName}" section |
| `app/hollywood-smile-colombia/page.tsx` | Header, hero copy, "Why {productName}" section |
| `app/signup/page.tsx` | Uses branding.productName |

### App — hardcoded "Nebula Smile" (must replace or switch to branding)
| File | Location |
|------|----------|
| `app/signin/page.tsx` | Line 54: header link "Nebula Smile" (no import of branding) |
| `app/legal/page.tsx` | title, heading, body "Nebula Smile is a USA LLC..." |
| `app/layout.tsx` | metaTitle, metaDescription (global metadata) |
| `app/page.tsx` | TESTIMONIALS quote "I recommend Nebula Smile to anyone..." |
| `app/components/WhatsAppButton.tsx` | DEFAULT_MESSAGE "Nebula Smile program" |
| `app/components/dashboard/CareCoordinatorSection.tsx` | message="...my Nebula Smile journey." |
| `app/components/specialist-profile/SpecialistAbout.tsx` | Two paragraphs "Nebula Smile curated network", "Nebula Smile connects you..." |
| `app/admin/leads/[id]/LeadCopyButtons.tsx` | introMessage, depositInvitation, followUpReminder "Nebula Smile", "Nebula Smile Team" |
| `app/specialists/[slug]/page.tsx` | Title, legal disclaimer "Nebula Smile coordinates..." |
| `app/api/stripe/checkout/route.ts` | product_data name fallback `"Nebula Smile"` (use branding for display name only; no logic change) |
| `app/api/health/route.ts` | `service: "nebula-smile"` (visible in health payload) |
| `app/api/status/route.ts` | `app: "nebula-smile"` (visible in status payload) |

---

## 2. Files with SEO / metadata references

| File | What to update |
|------|----------------|
| `app/layout.tsx` | title, description, openGraph.title, openGraph.description |
| `app/packages/page.tsx` | metadata.title "Packages \| Nebula Smile" |
| `app/tour-experiences/page.tsx` | metadata.title "Tour Experiences \| Nebula Smile" |
| `app/health-packages/page.tsx` | metadata.title "Health Packages \| Nebula Smile" |
| `app/legal/page.tsx` | metadata.title "Legal \| Nebula Smile" |
| `app/dental-implants-colombia/page.tsx` | metadata.title, openGraph.title |
| `app/veneers-colombia/page.tsx` | metadata.title, openGraph.title |
| `app/hollywood-smile-colombia/page.tsx` | metadata.title, openGraph.title |

---

## 3. Docs with old branding (prioritized for Phase 5)

**Priority (product name in operational/visible way):**
- `README.md` — project name, description
- `docs/OPERATIONS_INDEX.md` — product references
- `docs/TEST_FIRST_SALE.md` — product references
- `docs/ENVIRONMENTS.md` — title and body
- `docs/DEPLOYMENT_STRATEGY.md` — title, project examples
- `docs/VERCEL_PRODUCTION_VERIFICATION_GUIDE.md` — title, body
- `STATUS.md` — title
- `AGENTS.md` — title
- `CONTRIBUTING.md` — title
- `SECURITY.md` — title

**Other docs (many references):**  
ENGINEERING_HANDBOOK, GITHUB_ENTERPRISE_AUDIT_REPORT, SPRINT_SALIR_A_VENDER, DEPLOY_CHECKLIST, ESTRATEGIA_RAMAS_GITHUB, PRODUCTION_CHECKLIST, SECURITY_COMPLIANCE, SUPABASE_SETUP, CUSTOM_DOMAIN_VERCEL, VERCEL_SETUP, and 30+ other docs reference "Nebula Smile" or "Nebula Nexus". Per instructions: only update docs that reference the product name in a visible or operational way; do not rewrite historical audit docs unless clearly useful.

---

## 4. Risk classification

| Area | Risk | Notes |
|------|------|------|
| **lib/branding.ts** | LOW | Single source of truth; change values only. |
| **App UI (branding.*)** | LOW | No logic change; copy only. |
| **App UI (hardcoded)** | LOW | Replace with branding or "MedVoyage Smile". |
| **Metadata / SEO** | LOW | Title/description strings only. |
| **API routes (health, status)** | LOW | Response body label only; no contract change. |
| **Stripe checkout route** | LOW | Display name in product_data only; use branding; no payment logic. |
| **Tests** | LOW | tests/stripe-checkout-api.test.ts mocks package name "Nebula Smile Medellín"; update mock name if we want consistency (optional). |
| **Docs** | LOW | Text replacement; no code or schema. |
| **Repo name / deployment** | N/A | Not changed this sprint. |

**Overall: SAFE / MODERATE** — Branding and copy only; no backend logic, schema, Stripe logic, auth core, or API contracts changed.

---

## 5. Files likely affected (implementation)

**Phase 2–4 (brand + metadata):**  
lib/branding.ts, app/layout.tsx, app/signin/page.tsx, app/legal/page.tsx, app/page.tsx (testimonial), app/components/WhatsAppButton.tsx, app/components/dashboard/CareCoordinatorSection.tsx, app/components/specialist-profile/SpecialistAbout.tsx, app/admin/leads/[id]/LeadCopyButtons.tsx, app/specialists/[slug]/page.tsx, app/api/stripe/checkout/route.ts (display name), app/api/health/route.ts, app/api/status/route.ts, app/packages/page.tsx, app/tour-experiences/page.tsx, app/health-packages/page.tsx, app/dental-implants-colombia/page.tsx, app/veneers-colombia/page.tsx, app/hollywood-smile-colombia/page.tsx.

**Phase 5 (docs):**  
README.md, STATUS.md, AGENTS.md, CONTRIBUTING.md, SECURITY.md, docs/OPERATIONS_INDEX.md, docs/TEST_FIRST_SALE.md, docs/ENVIRONMENTS.md, docs/DEPLOYMENT_STRATEGY.md, docs/VERCEL_PRODUCTION_VERIFICATION_GUIDE.md (and optionally others from §3).

**Phase 6 (optional copy):**  
Selected micro-copy in landing, packages, or specialist pages to align with "premium, international, trustworthy, dental tourism, guided care" — minimal.

**Phase 7:**  
npm run lint, test, build, verify.
