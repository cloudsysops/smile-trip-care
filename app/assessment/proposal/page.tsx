import Link from "next/link";
import { branding } from "@/lib/branding";
import { getPublishedPackageBySlug, getPackageById } from "@/lib/packages";
import { getLeadByIdForMatching } from "@/lib/leads";
import { WhatsAppButton } from "@/app/components/WhatsAppButton";

/** Safe estimated savings ranges by treatment type (vs typical U.S. prices). Clearly labeled as estimates. */
const SAVINGS_BY_TREATMENT: Record<string, string> = {
  "Dental Implants": "50–70%",
  "Implants": "50–70%",
  "Veneers": "40–60%",
  "Hollywood Smile": "50–65%",
  "Full Mouth": "50–65%",
  "Aesthetic": "45–65%",
  "General": "40–70%",
};
const DEFAULT_SAVINGS = "40–70%";

/** Illustrative typical US cost ranges for comparison only. Not a quote. */
const US_RANGE_BY_TREATMENT: Record<string, string> = {
  "Dental Implants": "$8,000 – $15,000",
  "Implants": "$8,000 – $15,000",
  "Veneers": "$5,000 – $12,000",
  "Hollywood Smile": "$6,000 – $14,000",
  "Full Mouth": "$10,000 – $25,000",
  "Aesthetic": "$4,000 – $10,000",
  "General": "Varies by treatment",
};

/** Midpoint US estimate in cents for "You save $X" when we have SmileTripCare pricing. Illustrative only. */
const US_MID_CENTS_BY_TREATMENT: Record<string, number> = {
  "Dental Implants": 1_150_000, // ~$11,500
  "Implants": 1_150_000,
  "Veneers": 850_000, // ~$8,500
  "Hollywood Smile": 1_000_000, // ~$10,000
  "Full Mouth": 1_750_000, // ~$17,500
  "Aesthetic": 700_000, // ~$7,000
  "General": 1_000_000,
};

function getSavingsRange(specialties: string[]): string {
  const key = specialties.find((s) => SAVINGS_BY_TREATMENT[s] != null);
  return key ? SAVINGS_BY_TREATMENT[key] : DEFAULT_SAVINGS;
}

function getUsRange(specialties: string[]): string {
  const key = specialties.find((s) => US_RANGE_BY_TREATMENT[s] != null);
  return key ? US_RANGE_BY_TREATMENT[key] : "Varies by treatment";
}

function getUsMidCents(specialties: string[]): number | null {
  const key = specialties.find((s) => US_MID_CENTS_BY_TREATMENT[s] != null);
  return key ? US_MID_CENTS_BY_TREATMENT[key] ?? null : null;
}

const JOURNEY_STEPS = [
  { label: "Complete your assessment", desc: "Share your goals, photos, and basic history in a few minutes." },
  { label: "Dental specialists review", desc: "Our vetted specialists review your case and propose options." },
  { label: "Coordinator plans your trip", desc: "Your dental travel coordinator helps plan treatment and travel dates." },
  { label: "Smile transformation in Colombia", desc: "Receive treatment in Colombia with guided care and follow-up." },
];

const RECOMMENDATION_DISCLAIMER =
  "This recommendation is based on the information provided and serves as an orientation only. Final treatment planning belongs to the specialist.";

type Props = Readonly<{ searchParams: Promise<{ lead_id?: string; recommended_package_slug?: string }> }>;

export default async function ProposalPage({ searchParams }: Props) {
  const { lead_id, recommended_package_slug } = await searchParams;
  if (process.env.NODE_ENV === "development") {
    console.warn("[Proposal page]", { lead_id, recommended_package_slug });
  }
  const recommendedPackage =
    recommended_package_slug?.trim()
      ? await getPublishedPackageBySlug(recommended_package_slug.trim())
      : null;

  let cityPreference = recommendedPackage?.location?.trim() ?? "";
  let treatmentTypes: string[] = [];
  if (lead_id?.trim()) {
    const leadContext = await getLeadByIdForMatching(lead_id.trim());
    if (leadContext) {
      treatmentTypes = leadContext.selected_specialties ?? [];
      if (!cityPreference) {
        const pkgId = leadContext.recommended_package_id ?? leadContext.package_id;
        if (pkgId) {
          const pkg = await getPackageById(pkgId);
          cityPreference = pkg?.location?.trim() ?? "";
        }
      }
    }
  }

  const savingsRange = getSavingsRange(treatmentTypes);
  const usRange = getUsRange(treatmentTypes);
  const usMidCents = getUsMidCents(treatmentTypes);
  const packagePriceCents =
    recommendedPackage?.price_cents != null && recommendedPackage.price_cents > 0
      ? recommendedPackage.price_cents
      : null;
  const savingsDollars =
    usMidCents != null && packagePriceCents != null && usMidCents > packagePriceCents
      ? Math.round((usMidCents - packagePriceCents) / 100)
      : null;
  const treatmentLabel =
    treatmentTypes[0] ?? recommendedPackage?.name ?? "my treatment";
  const whatsAppMessage = `Hi! I completed my assessment for ${treatmentLabel} and saw the estimated savings. Can a coordinator help me review my treatment plan?`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white">
            ← {branding.productName}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-24">
        {/* Top conversion block: plan ready + savings + coordinator + primary CTA */}
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-6 text-center shadow-lg shadow-emerald-950/30 sm:p-8">
          <h1 className="font-serif text-2xl font-normal tracking-tight text-white sm:text-3xl">
            Your smile plan is ready
          </h1>
          <p className="mt-2 text-lg font-semibold text-emerald-300">
            {savingsDollars != null
              ? `Estimated savings: $${savingsDollars.toLocaleString()}+`
              : `Estimated savings: ${savingsRange}`}
          </p>
          <p className="mt-3 text-zinc-300">
            A dental travel coordinator can now help you review your options.
          </p>
          <div className="mt-6">
            <WhatsAppButton
              message={whatsAppMessage}
              label="Discuss My Treatment Plan on WhatsApp"
              variant="inline"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border-0 bg-emerald-600 px-8 text-base font-semibold hover:bg-emerald-700 sm:w-auto"
            />
          </div>
        </div>

        {/* Personalized preview summary */}
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center sm:p-6">
          <h2 className="font-serif text-xl font-normal tracking-tight text-white">
            Your personalized smile preview
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Based on your assessment, here&apos;s what you can expect with {branding.productName}—and your next steps.
          </p>
        </div>

        {/* Savings Widget: Typical US cost vs Colombia */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl shadow-black/20" aria-labelledby="savings-heading">
          <h2 id="savings-heading" className="text-xl font-serif font-normal text-white">
            Typical US cost vs Colombia
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Compare typical U.S. costs with estimated Colombia packages from {branding.productName}—your final quote comes after specialist review.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Estimated US cost</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-300">{usRange}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Typical range for similar treatment</p>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{branding.productName}</p>
              {recommendedPackage ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-white">{recommendedPackage.name}</p>
                  {(recommendedPackage.price_cents != null && recommendedPackage.price_cents > 0) ? (
                    <p className="mt-0.5 text-sm tabular-nums text-emerald-400">
                      From ${(recommendedPackage.price_cents / 100).toLocaleString()} USD
                    </p>
                  ) : recommendedPackage.deposit_cents != null && recommendedPackage.deposit_cents > 0 ? (
                    <p className="mt-0.5 text-sm text-zinc-400">
                      Deposit from ${(recommendedPackage.deposit_cents / 100).toFixed(2)} USD
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-zinc-400">Quote after specialist review</p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-zinc-400">Quote after specialist review</p>
              )}
            </div>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">You save</p>
              {savingsDollars != null ? (
                <>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
                    ${savingsDollars.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">vs. typical U.S. prices</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">{savingsRange}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">vs. typical U.S. prices</p>
                </>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Savings are estimates. Final pricing depends on your treatment plan. We&apos;ll give you a clear quote after specialist review.
          </p>
        </section>

        {/* Journey timeline: How your smile journey works */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6" aria-labelledby="journey-heading">
          <h2 id="journey-heading" className="text-xl font-serif font-normal text-white">
            How your smile journey works
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            From assessment to smile transformation—we coordinate every step.
          </p>
          <ol className="mt-4 space-y-4">
            {JOURNEY_STEPS.map((step, i) => (
              <li key={step.label} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-400">
                  {i + 1}
                </span>
                <div>
                  <span className="font-medium text-white">{step.label}</span>
                  <p className="mt-0.5 text-sm text-zinc-400">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Recommended package (when available) */}
        {recommendedPackage && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Suggested package</h2>
            <p className="mt-2 font-semibold text-white">{recommendedPackage.name}</p>
            {cityPreference && (
              <p className="mt-1 text-sm text-zinc-400">Location: {cityPreference}</p>
            )}
            {recommendedPackage.deposit_cents != null && recommendedPackage.deposit_cents > 0 && (
              <p className="mt-1 text-sm text-zinc-400">
                Deposit: ${(recommendedPackage.deposit_cents / 100).toFixed(2)} USD
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-500 italic">{RECOMMENDATION_DISCLAIMER}</p>
            <Link
              href={`/packages/${recommendedPackage.slug}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View package details →
            </Link>
          </div>
        )}

        {/* Suggested city (when no package but we have city) */}
        {!recommendedPackage && cityPreference && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Suggested city</h2>
            <p className="mt-2 font-medium text-white">{cityPreference}</p>
            <p className="mt-1 text-sm text-zinc-400">Our team will tailor options to this location.</p>
          </div>
        )}

        {/* Why patients trust SmileTripCare */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6" aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="text-xl font-serif font-normal text-white">
            Why patients trust {branding.productName}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Verified dental clinics, international patient coordination, secure deposit payments, and guided travel and treatment planning.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>Verified dental clinics</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>International patient coordination</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>Secure deposit payments</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>Guided travel and treatment planning</span>
            </li>
          </ul>
        </section>

        {/* Reference */}
        {lead_id && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            Reference: <span className="font-mono text-zinc-400">{lead_id}</span>
          </p>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          <WhatsAppButton
            message={whatsAppMessage}
            label="Discuss My Treatment Plan on WhatsApp"
            variant="inline"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-0 bg-emerald-600 px-6 font-semibold hover:bg-emerald-700 sm:w-auto"
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/packages"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-600 px-6 font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/80"
            >
              View packages
            </Link>
            {recommendedPackage?.deposit_cents != null && recommendedPackage.deposit_cents > 0 && (
              <Link
                href="/login?next=/patient"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-950/50 px-6 font-medium text-emerald-300 hover:bg-emerald-950/80"
              >
                Pay deposit
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-600 px-6 font-medium text-zinc-400 hover:text-white"
            >
              Back to home
            </Link>
          </div>
          <p className="text-center text-sm text-zinc-500">
            <Link href="/signup" className="text-zinc-400 underline hover:text-white">Create an account</Link>
            {" or "}
            <Link href="/login?next=/patient" className="text-zinc-400 underline hover:text-white">Log in</Link>
            {" with the same email to see your journey and pay the deposit online."}
          </p>
        </div>

        {/* Optional: short FAQ */}
        <details className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <summary className="cursor-pointer font-medium text-zinc-300 hover:text-white">Quick FAQ</summary>
          <dl className="mt-4 space-y-3 text-sm text-zinc-400">
            <div>
              <dt className="font-medium text-zinc-300">When will I hear back?</dt>
              <dd>Usually within 24 hours on business days. We&apos;ll email you (or call if you shared your number).</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-300">Is the assessment binding?</dt>
              <dd>No. This is a free evaluation. You only pay a deposit when you&apos;re ready to secure your booking.</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-300">Can I message you on WhatsApp?</dt>
              <dd>Yes. Use the green button above for quick questions or to start a conversation.</dd>
            </div>
          </dl>
        </details>

        <p className="mt-6 text-center">
          <Link href={`/thank-you?${new URLSearchParams({ ...(lead_id && { lead_id }), ...(recommended_package_slug && { recommended_package_slug }) }).toString()}`} className="text-xs text-zinc-500 hover:text-zinc-400">
            View full confirmation page →
          </Link>
        </p>
      </main>
    </div>
  );
}
