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

function getSavingsRange(specialties: string[]): string {
  const key = specialties.find((s) => SAVINGS_BY_TREATMENT[s] != null);
  return key ? SAVINGS_BY_TREATMENT[key] : DEFAULT_SAVINGS;
}

const JOURNEY_STEPS = [
  { label: "Assessment", desc: "You share your goals and we review your case." },
  { label: "Specialist review", desc: "Our team matches you with the best option." },
  { label: "Treatment planning", desc: "Personalized plan and transparent quote." },
  { label: "Travel", desc: "We coordinate flights, stay, and clinic visits." },
  { label: "Smile transformation", desc: "Treatment and follow-up in Colombia." },
];

const RECOMMENDATION_DISCLAIMER =
  "This recommendation is based on the information provided and serves as an orientation only. Final treatment planning belongs to the specialist.";

type Props = Readonly<{ searchParams: Promise<{ lead_id?: string; recommended_package_slug?: string }> }>;

export default async function ProposalPage({ searchParams }: Props) {
  const { lead_id, recommended_package_slug } = await searchParams;
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white">
            ← {branding.productName}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Hero: Your Personalized Smile Preview */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Your Personalized Smile Preview
          </h1>
          <p className="mt-2 text-zinc-300">
            Based on your assessment, here’s what you can expect with {branding.productName}—and your next steps.
          </p>
        </div>

        {/* Estimated savings card */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6" aria-labelledby="savings-heading">
          <h2 id="savings-heading" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Estimated savings vs. U.S. prices
          </h2>
          <p className="mt-2 text-3xl font-bold text-emerald-400 tabular-nums">{savingsRange}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Savings are estimates and depend on your final treatment plan. We’ll give you a clear quote after specialist review.
          </p>
        </section>

        {/* Journey stepper */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6" aria-labelledby="journey-heading">
          <h2 id="journey-heading" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Your likely journey
          </h2>
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

        {/* Trust */}
        <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6" aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Why choose us
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>Response within ~24 hours on business days</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>Secure deposit options (Stripe)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>International patient coordination</span>
            </li>
            <li className="flex gap-3">
              <span className="text-emerald-400" aria-hidden>✓</span>
              <span>WhatsApp support for questions</span>
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
            message="Hi! I just completed my Smile Assessment on MedVoyage Smile and I'd like to speak with a coordinator."
            label="Chat on WhatsApp"
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
              <dd>Usually within 24 hours on business days. We’ll email you (or call if you shared your number).</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-300">Is the assessment binding?</dt>
              <dd>No. This is a free evaluation. You only pay a deposit when you’re ready to secure your booking.</dd>
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
