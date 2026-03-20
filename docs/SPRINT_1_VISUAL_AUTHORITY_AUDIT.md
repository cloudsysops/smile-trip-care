# Sprint 1: Visual Authority — Phase 1 Audit

**Date:** 2026-03-10  
**Scope:** Frontend UI/CSS/copy only. No Stripe, Supabase, auth, API, or deployment changes.

---

## 1. Visual weaknesses

| Area | Finding |
|------|--------|
| **Typography consistency** | Serif (Instrument Serif) is applied only on the **landing H1** and one final CTA heading. Packages, assessment, proposal, thank-you, login, signup, and SEO pages still use system/sans-only for all headings — feels inconsistent and less premium. |
| **Header consistency** | Landing uses a **glass navbar** (bg-white/70, backdrop-blur-md); all other pages use opaque dark header (bg-zinc-950/95). Secondary pages feel less polished. |
| **Trust microcopy** | Hero trust line is generic (“No commitment · Response within 24 hours”). Missing stronger lines such as “Trusted by international patients”, “Secure deposit process”, “Guided by concierge coordinators”. Thank-you page does not use concierge-led copy (e.g. “Expect a WhatsApp message within 2 hours”). |
| **AuthorityBar** | Exists and is good. Spec asked for items like “International Patient Coordination”, “Verified Clinic Network” — current items are clinic names; can align labels with trust themes. |
| **Nav link contrast (landing)** | Two nav links (“Clinical network”, “Partners”) still use `text-zinc-400` on a light glass bar; should be `text-zinc-600` for consistency and readability. |

---

## 2. Spacing inconsistencies

| Page | Current | Issue |
|------|--------|-------|
| **Landing** | main py-16–32, sections py-16–24 | Good; already upgraded. |
| **Packages** | main py-8 md:py-10, section mb-8 | Feels tight; should be py-16–24 and more section breathing room. |
| **Assessment** | main py-8 md:py-12 | Could be py-12–24 for calmer, premium feel. |
| **Proposal** | main py-8 sm:py-12 | Could be py-12–24. |
| **Thank-you** | main py-10 sm:py-16 | Adequate; minor bump to py-12–20 possible. |
| **Login / Signup** | main py-12 | Adequate; optional py-16. |
| **SEO (dental/veneers/hollywood)** | main py-10 sm:py-14, sections mb-16 | Sections could use py-20–28 and consistent rhythm. |

---

## 3. Weak trust signals

- **Landing:** No explicit “Trusted by international patients” / “Secure deposit” / “Concierge coordinators” under CTAs.
- **Thank-you:** “We usually respond within 24 hours” is good but could add “Expect a WhatsApp message to confirm your plan” for a more concierge-led feel.
- **Proposal:** Trust section exists; could add one line about “Price-locked guarantee” or “Verified by specialists” near CTAs (copy only).
- **Auth:** No trust line; could add a single line under form (e.g. “Secure sign-in. Your data is protected.”).

---

## 4. Sections that feel too plain / dev-like

- **Packages:** Page title “Treatment packages” is plain; intro paragraph is small; no serif or visual hierarchy. Card grid is functional but cards could use a subtle shadow and clearer hover state.
- **Assessment:** Block of small text (privacy, 24h) feels dense; form is clean but header could feel more premium (serif title, more spacing).
- **Proposal:** Cards are rounded-2xl but flat; savings card could feel more “premium” with a soft shadow or gradient border.
- **Thank-you:** Success card is good; “What happens next” is clear but could use slightly more spacing and one concierge line.
- **Login/Signup:** Simple card; no serif on title; looks generic. One-line trust copy would help.
- **SEO pages:** Long content; H1s are bold but not serif; section spacing is regular, not “premium rhythm.”

---

## 5. Pages with the biggest perception gap

1. **/packages** — First place after landing; still feels like an internal list. Needs stronger intro, serif H1, better spacing, and slightly more premium card styling.
2. **/assessment** — Critical for conversion; needs calmer hierarchy and serif title so it feels part of the same premium system.
3. **/assessment/proposal** — Key conversion moment; needs serif on “Your Personalized Smile Preview”, slightly stronger savings card and trust block.
4. **/thank-you** — Last impression; one concierge line and serif on main heading would align it with the rest.
5. **/login and /signup** — Quick win: serif on title + one trust line.
6. **SEO pages** — H1 in serif + slightly more section breathing room would close the gap without rewriting content.

---

## 6. Files likely to change

| File | Changes (UI/CSS/copy only) |
|------|----------------------------|
| `app/page.tsx` | Fix Clinical network / Partners nav to text-zinc-600; strengthen hero trust microcopy. |
| `app/packages/page.tsx` | Serif on H1; optional glass or consistent header; main py-16–24; intro spacing. |
| `app/assessment/page.tsx` | Serif on H1; main py-12–24; optional header polish. |
| `app/assessment/proposal/page.tsx` | Serif on H1; savings/trust card polish (shadow/border); main padding. |
| `app/thank-you/page.tsx` | Serif on H1; one concierge line in copy; optional spacing. |
| `app/login/page.tsx` | Serif on H1; optional trust line; optional header. |
| `app/signup/page.tsx` | Serif on H1; optional trust line; optional header. |
| `app/dental-implants-colombia/page.tsx` | Serif on H1; section py-20–28. |
| `app/veneers-colombia/page.tsx` | Serif on H1; section py-20–28. |
| `app/hollywood-smile-colombia/page.tsx` | Serif on H1; section py-20–28. |
| `app/components/landing/AuthorityBar.tsx` | Optionally align labels with trust themes (International Patient Coordination, etc.). |
| `app/components/marketplace/MarketplacePackageCard.tsx` | Subtle shadow, hover state (border/scale). |

**Not touched:** layout (fonts already set), AssessmentForm logic, API routes, lead flow, webhook, package loading, deploy config.

---

## 7. Risk classification

**SAFE**

- Only frontend UI, Tailwind classes, layout structure, and non-functional copy.
- No Stripe, Supabase, auth logic, API routes, lead submission, webhooks, or schema.
- High impact on perception and conversion readiness; low risk to stability.

---

## 8. Implementation order

1. **Landing** — Nav link fix + hero trust microcopy (Phase 3/8).
2. **Typography** — Apply `font-serif` to H1 (and key H2) on packages, assessment, proposal, thank-you, login, signup, SEO pages (Phase 2).
3. **Spacing** — Increase main/section padding on packages, assessment, proposal, thank-you, SEO pages (Phase 5).
4. **AuthorityBar** — Optionally update labels to trust-themed (Phase 4).
5. **Cards** — MarketplacePackageCard shadow/hover; proposal savings card polish (Phase 6).
6. **Thank-you** — One concierge line (Phase 8).
7. **Auth** — One trust line under form (Phase 8).
8. **Verify** — Run lint, test, build, verify (Phase 10).

No changes to deployment, env, or any backend.
