import Link from "next/link";
import { branding } from "@/lib/branding";
import { getPublishedPackagesWithFilters } from "@/lib/packages";
import type { PackageType } from "@/lib/packages";
import MarketplacePackageCard from "@/app/components/marketplace/MarketplacePackageCard";
import PackageFiltersForm from "@/app/components/marketplace/PackageFiltersForm";

type Props = { searchParams: Promise<{ city?: string; type?: string; minPrice?: string; maxPrice?: string; minDuration?: string; maxDuration?: string }> };

function parseFilters(params: Record<string, string | undefined>) {
  const minPrice = params.minPrice != null && params.minPrice !== "" ? Number(params.minPrice) * 100 : undefined;
  const maxPrice = params.maxPrice != null && params.maxPrice !== "" ? Number(params.maxPrice) * 100 : undefined;
  const minDuration = params.minDuration != null && params.minDuration !== "" ? Number(params.minDuration) : undefined;
  const maxDuration = params.maxDuration != null && params.maxDuration !== "" ? Number(params.maxDuration) : undefined;
  return {
    city: params.city && params.city.length > 0 ? params.city : undefined,
    type: (params.type as PackageType | undefined) && ["health", "tour", "combo"].includes(params.type!) ? params.type as PackageType : undefined,
    minPrice,
    maxPrice,
    minDuration,
    maxDuration,
  };
}

export const metadata = {
  title: "Packages | Nebula Smile",
  description: "Browse health, tour, and combo packages in Medellín and Manizales.",
};

export default async function PackagesPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const packages = await getPublishedPackagesWithFilters(filters);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded"
          >
            ← {branding.productName}
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white md:text-3xl">Treatment packages</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Premium dental and recovery journeys in Medellín and Manizales. Compare options and start with a free assessment.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <section className="mb-8">
          <PackageFiltersForm basePath="/packages" searchParams={params} showTypeFilter={true} />
        </section>
        {packages.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
            <p className="text-zinc-400">No packages match your filters.</p>
            <p className="mt-2 text-sm text-zinc-500">Try adjusting city, type, or price range.</p>
            <Link href="/packages" className="mt-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">View all packages →</Link>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <MarketplacePackageCard key={pkg.id} pkg={pkg} />
            ))}
          </ul>
        )}
        {packages.length > 0 && (
          <p className="mt-8 text-center text-sm text-zinc-500">
            {branding.productName} — A {branding.companyName} company.
          </p>
        )}
      </main>
    </div>
  );
}
