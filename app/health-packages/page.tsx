import Link from "next/link";
import { getPublishedPackagesWithFilters } from "@/lib/packages";
import MarketplacePackageCard from "@/app/components/marketplace/MarketplacePackageCard";
import PackageFiltersForm from "@/app/components/marketplace/PackageFiltersForm";

type Props = { searchParams: Promise<{ city?: string; minPrice?: string; maxPrice?: string; minDuration?: string; maxDuration?: string }> };

function parseFilters(params: Record<string, string | undefined>) {
  const minPrice = params.minPrice != null && params.minPrice !== "" ? Number(params.minPrice) * 100 : undefined;
  const maxPrice = params.maxPrice != null && params.maxPrice !== "" ? Number(params.maxPrice) * 100 : undefined;
  const minDuration = params.minDuration != null && params.minDuration !== "" ? Number(params.minDuration) : undefined;
  const maxDuration = params.maxDuration != null && params.maxDuration !== "" ? Number(params.maxDuration) : undefined;
  return {
    type: "health" as const,
    city: params.city && params.city.length > 0 ? params.city : undefined,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
  };
}

export const metadata = {
  title: "Health Packages | MedVoyage Smile",
  description: "Health treatment packages in Medellín and Manizales.",
};

export default async function HealthPackagesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const packages = await getPublishedPackagesWithFilters(filters);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded"
          >
            ← All packages
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Health Packages</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Medical and health treatment packages in Medellín and Manizales.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8">
          <PackageFiltersForm basePath="/health-packages" searchParams={params} showTypeFilter={false} />
        </section>
        {packages.length === 0 ? (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
            No health packages match your filters.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <MarketplacePackageCard key={pkg.id} pkg={pkg} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
