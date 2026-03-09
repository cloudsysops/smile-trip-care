import Link from "next/link";
import { getPublishedExperiencesWithFilters } from "@/lib/experiences";
import MarketplaceExperienceCard from "@/app/components/marketplace/MarketplaceExperienceCard";
import ExperienceFiltersForm from "@/app/components/marketplace/ExperienceFiltersForm";

type Props = { searchParams: Promise<{ city?: string; category?: string; minPrice?: string; maxPrice?: string; minDuration?: string; maxDuration?: string }> };

function parseFilters(params: Record<string, string | undefined>) {
  const minPrice = params.minPrice != null && params.minPrice !== "" ? Number(params.minPrice) * 100 : undefined;
  const maxPrice = params.maxPrice != null && params.maxPrice !== "" ? Number(params.maxPrice) * 100 : undefined;
  const minDuration = params.minDuration != null && params.minDuration !== "" ? Number(params.minDuration) : undefined;
  const maxDuration = params.maxDuration != null && params.maxDuration !== "" ? Number(params.maxDuration) : undefined;
  return {
    city: params.city && params.city.length > 0 ? params.city : undefined,
    category: params.category && params.category.length > 0 ? params.category : undefined,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
  };
}

export const metadata = {
  title: "Tour Experiences | MedVoyage Smile",
  description: "Recovery and tour experiences in Medellín and Manizales.",
};

export default async function TourExperiencesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const experiences = await getPublishedExperiencesWithFilters(filters);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded"
          >
            ← Marketplace
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Tour Experiences</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Recovery and tourism activities in Medellín and Manizales.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8">
          <ExperienceFiltersForm searchParams={params} />
        </section>
        {experiences.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
            No experiences match your filters.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {experiences.map((exp) => (
              <MarketplaceExperienceCard key={exp.id} experience={exp} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
