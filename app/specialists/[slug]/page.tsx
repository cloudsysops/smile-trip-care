import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpecialistBySlug } from "@/lib/specialists";
import SpecialistHero from "@/app/components/specialist-profile/SpecialistHero";
import SpecialistAbout from "@/app/components/specialist-profile/SpecialistAbout";
import SpecialistClinic from "@/app/components/specialist-profile/SpecialistClinic";
import SpecialistTreatments from "@/app/components/specialist-profile/SpecialistTreatments";
import SpecialistJourney from "@/app/components/specialist-profile/SpecialistJourney";
import SpecialistGallery from "@/app/components/specialist-profile/SpecialistGallery";

type PageProps = { params: Promise<{ slug: string }> };

/** Default treatments when specialist has none configured (e.g. future treatments_offered column). */
const DEFAULT_TREATMENTS = [
  "Dental Implants",
  "Smile Design",
  "Oral Rehabilitation",
  "Cosmetic Dentistry",
  "Diagnostic Evaluation",
];

export default async function SpecialistProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const specialist = await getSpecialistBySlug(slug);
  if (!specialist) {
    notFound();
  }

  const institutionName = specialist.clinic_name ?? specialist.clinic ?? "Partner institution";
  const location = specialist.city;
  // TODO: Resolve specialist.photo_asset_id to image URL when asset lookup is available.
  const imageUrl = null as string | null;
  const treatments = DEFAULT_TREATMENTS;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-white hover:text-zinc-200">
            Nebula Smile
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/#specialists" className="text-sm font-medium text-zinc-400 hover:text-white">
              Specialists
            </Link>
            <Link
              href="/assessment"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
            >
              Start Free Evaluation
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/#specialists" className="text-sm text-zinc-400 hover:text-white">
            ← Back to specialists
          </Link>
        </div>

        <div className="space-y-12 md:space-y-16">
          <SpecialistHero
            name={specialist.name}
            specialty={specialist.specialty}
            city={specialist.city}
            clinicOrInstitution={institutionName}
            imageUrl={imageUrl}
          />

          <SpecialistAbout
            description={specialist.description}
            bio={specialist.bio ?? null}
            name={specialist.name}
          />

          <SpecialistClinic
            institutionName={institutionName}
            location={location}
            description={specialist.description}
            imageUrl={null}
          />

          <SpecialistTreatments treatments={treatments} />

          <SpecialistJourney />

          {/* Location */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Location</h2>
            <p className="mb-6 text-2xl font-bold text-white md:text-3xl">Where we work</p>
            <p className="text-zinc-400">
              {specialist.city}. Our network includes trusted partners in Manizales and Medellín—treatment and recovery are coordinated across both cities where applicable.
            </p>
            <div className="mt-6 aspect-video w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center text-zinc-500">
              Map placeholder — approved map embed or image can be added here
            </div>
          </section>

          <SpecialistGallery />

          {/* Trust and safety */}
          <section className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-6 md:p-8">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Trust and safety</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Nebula Smile coordinates the experience—from free evaluation to travel and recovery—while medical services are provided by licensed specialists and institutions in Colombia. We do not provide medical advice, diagnosis, or treatment. This specialist is part of our curated network of trusted partners.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/assessment"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Start Free Evaluation
          </Link>
          <Link
            href="/#packages"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-zinc-600 px-8 py-4 text-base font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80"
          >
            View packages
          </Link>
        </div>
      </main>
    </div>
  );
}
