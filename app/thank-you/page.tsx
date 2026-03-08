import Link from "next/link";
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
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            ← Nebula Smile
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:py-16">
        <h1 className="text-2xl font-semibold">Your request has been received</h1>
        <p className="mt-4 text-zinc-400">
          Thank you for your interest in Nebula Smile. Our team will review your details and
          get in touch within 24 hours.
        </p>

        {recommendedPackage && (
          <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-6 text-left">
            <h2 className="text-sm font-semibold text-white">Recommended package (orientation)</h2>
            <p className="mt-1 font-medium text-zinc-200">{recommendedPackage.name}</p>
            {recommendedPackage.deposit_cents != null && recommendedPackage.deposit_cents > 0 && (
              <p className="mt-1 text-sm text-zinc-400">
                Deposit: ${(recommendedPackage.deposit_cents / 100).toFixed(2)} USD
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-500 italic">{RECOMMENDATION_DISCLAIMER}</p>
            <Link
              href={`/packages/${recommendedPackage.slug}`}
              className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              View package details →
            </Link>
          </div>
        )}

        {recommendedSpecialist && (
          <div className="mt-6 text-left">
            <h2 className="text-sm font-semibold text-white">Recommended specialist</h2>
            <p className="mt-1 text-xs text-zinc-500 italic">{RECOMMENDATION_DISCLAIMER}</p>
            <div className="mt-3">
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

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-left">
          <h2 className="text-sm font-semibold text-white">Next steps</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-400">
            <li>Review by our team</li>
            <li>Contact within 24 hours</li>
            <li>You can also message us on WhatsApp anytime</li>
          </ul>
        </div>

        {lead_id && (
          <p className="mt-4 text-sm text-zinc-500">
            Reference: <span className="font-mono text-zinc-400">{lead_id}</span>
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <WhatsAppButton
            label="Message us on WhatsApp"
            variant="inline"
            className="inline-flex justify-center rounded-full border-0 bg-emerald-600 hover:bg-emerald-700"
          />
          <Link
            href="/"
            className="inline-block rounded-full border border-zinc-600 px-8 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Back to home
          </Link>
          <Link href="/#packages" className="text-sm font-medium text-zinc-400 underline hover:text-white">
            View packages
          </Link>
          <Link href="/signup" className="text-sm font-medium text-zinc-400 underline hover:text-white">
            Create account
          </Link>
          <Link href="/login?next=/patient" className="text-sm font-medium text-zinc-400 underline hover:text-white">
            Log in to your dashboard
          </Link>
        </div>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Create an account with the same email to see your journey and pay the deposit online.
        </p>
      </main>
    </div>
  );
}
