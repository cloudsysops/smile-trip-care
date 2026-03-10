import Link from "next/link";
import { branding } from "@/lib/branding";
import { getPublishedPackageBySlug, getPackageById } from "@/lib/packages";
import { getLeadByIdForMatching } from "@/lib/leads";
import { getRecommendedSpecialist } from "@/lib/specialists";
import { WhatsAppButton } from "../components/WhatsAppButton";
import RecommendedDoctorCard from "../components/booking/RecommendedDoctorCard";

const RECOMMENDATION_DISCLAIMER =
  "This recommendation is based on the information provided and serves as an orientation only. Final treatment planning belongs to the specialist.";

type Props = Readonly<{ searchParams: Promise<{ lead_id?: string; recommended_package_slug?: string }> }>;

export default async function ThankYouPage({ searchParams }: Props) {
  const { lead_id, recommended_package_slug } = await searchParams;
  const recommendedPackage =
    recommended_package_slug?.trim() ?
      await getPublishedPackageBySlug(recommended_package_slug.trim())
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
  const recommendedSpecialist =
    cityPreference
      ? await getRecommendedSpecialist({ cityPreference, treatmentTypes })
      : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white">
            ← {branding.productName}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 font-serif text-2xl font-normal tracking-tight text-white md:text-3xl">
            Request received — your free evaluation is in progress
          </h1>
          <p className="mt-3 text-zinc-300">
            Thank you for your interest in {branding.productName}. Our coordinator and specialist team will review your
            details and prepare a personalized recommendation.
          </p>
          {(recommendedPackage?.name || cityPreference) && (
            <p className="mt-2 text-sm font-medium text-emerald-200/90">
              We&apos;ll review your case for {[recommendedPackage?.name, cityPreference].filter(Boolean).join(" · ")}.
            </p>
          )}
          <p className="mt-2 text-sm text-zinc-500">
            We usually respond within <span className="font-medium text-zinc-300">24 hours</span> on business days. Expect a
            WhatsApp message to confirm your plan. No commitment — this is a free evaluation to help you plan your smile journey.
          </p>
        </div>

        {recommendedPackage && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Recommended package</h2>
            <p className="mt-2 font-semibold text-white">{recommendedPackage.name}</p>
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

        {recommendedSpecialist && (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Recommended specialist</h2>
            <p className="mt-1 text-xs text-zinc-500 italic">{RECOMMENDATION_DISCLAIMER}</p>
            <div className="mt-4">
              <RecommendedDoctorCard
                name={recommendedSpecialist.name}
                clinic={recommendedSpecialist.clinic_name ?? recommendedSpecialist.clinic}
                city={recommendedSpecialist.city}
                specialty={recommendedSpecialist.specialty}
                yearsOfExperience={null}
                photoUrl={null}
                slug={recommendedSpecialist.slug}
              />
            </div>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">What happens next</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                1
              </span>
              <span>Our team reviews your submission and matches you with the best option.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                2
              </span>
              <span>We&apos;ll contact you within 24 hours by email (or phone if you shared it).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                3
              </span>
              <span>You can message us on WhatsApp anytime with questions.</span>
            </li>
          </ul>
        </div>

        {lead_id && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Reference: <span className="font-mono text-zinc-400">{lead_id}</span>
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <WhatsAppButton
            message="Hi! I just completed my Smile Assessment on MedVoyage Smile and I'd like to speak with a coordinator."
            label="Message us on WhatsApp"
            variant="inline"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border-0 bg-emerald-600 px-6 font-semibold hover:bg-emerald-700"
          />
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-600 px-6 font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/80"
          >
            Back to home
          </Link>
          <Link href="/packages" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-600 px-6 font-medium text-zinc-400 hover:text-white">
            View packages
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/signup" className="text-zinc-400 underline hover:text-white">Create an account</Link>
          {" or "}
          <Link href="/login?next=/patient" className="text-zinc-400 underline hover:text-white">log in</Link>
          {" with the same email to see your journey and pay the deposit online."}
        </p>
      </main>
    </div>
  );
}
