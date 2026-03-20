## SmileTripCare rebrand (frontend UI + SEO)

### Summary
This rebrand updates the visible frontend product branding from the previous name (“MedVoyage Smile”) to **SmileTripCare**, focusing on:
1. Consistent UI/product naming across public pages and key dashboard shells.
2. SEO metadata alignment (titles/descriptions) for the main funnel pages.
3. Premium, trustworthy presentation (small dark UI polish where branding is visible).
4. Domain-aware “assessment” links in AI/automation messaging (using env, preserving localhost).

### What changed (visible branding)
- Central source of truth moved to `lib/branding.ts`
  - `branding.productName`: now `SmileTripCare`
  - `branding.companyName`: now `SmileTripCare`
  - Updated tagline + support copy to match a calm, trustworthy medical tourism tone.
- Marketing/testimonial messaging updated to remove “MedVoyage Smile” wording and use `SmileTripCare`.
- WhatsApp default messaging and patient dashboard coordinator messaging now use the new branding value.

### Metadata / SEO updates
Updated titles/descriptions so that the funnel pages reflect the new brand:
- `app/layout.tsx` (global metadata title/description)
- `app/packages/page.tsx` (`Packages | SmileTripCare`)
- `app/packages/[slug]/page.tsx`
  - Added `generateMetadata()` so package pages get dynamic SEO titles/descriptions aligned to `SmileTripCare`.
- `app/trust-and-safety/page.tsx`
- `app/how-payments-work/page.tsx`
- `app/our-clinical-network/page.tsx`

### Domain-aware copy (without hardcoding production domains)
Previously, some AI/automation prompts included a hardcoded dev URL for the assessment CTA.

Now those prompts use:
- `process.env.NEXT_PUBLIC_SITE_URL` when set
- otherwise fall back to `http://localhost:3000`

Files updated:
- `lib/ai/aiResponder.ts`
- `lib/growth/aiResponder.ts`
- `lib/ai/reddit-responder.ts`

### Premium frontend polish applied
- Home page top navigation now uses the same dark theme as the rest of the public UI.
  - `app/page.tsx`
- Package detail page now renders in dark UI and includes trust/payments links next to the CTA.
  - `app/packages/[slug]/page.tsx`

### Intentionally not renamed / not changed
- Stripe payment logic, webhook behavior, auth/session architecture, and Supabase business logic were not modified.
- Internal identifiers, DB schema, and route names were left as-is; only user-visible naming/copy/metadata was rebranded.

### How to validate locally
1. `npm run dev`
2. Verify:
   - `/` header + hero copy looks coherent and dark
   - `/packages` and `/packages/[slug]` show “SmileTripCare” in title/hero/CTA area
   - `/trust-and-safety`, `/how-payments-work`, `/our-clinical-network` show brand in copy/metadata
   - WhatsApp buttons still open correctly
3. Run `npm run verify` (CI-level lint/test/build checks).

