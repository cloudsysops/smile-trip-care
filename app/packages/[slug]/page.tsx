import Link from "next/link";
import { notFound } from "next/navigation";
import { branding } from "@/lib/branding";
import { getPublishedPackageBySlug } from "@/lib/packages";
import { getPublishedAssets } from "@/lib/assets";

type SearchValue = string | string[] | undefined;
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, SearchValue>>;
};

function getFirstQueryValue(value: SearchValue): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => item.trim().length > 0);
    return first;
  }
  return undefined;
}

export default async function PackagePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const pkg = await getPublishedPackageBySlug(slug);
  if (!pkg) notFound();

  const assessmentQuery = new URLSearchParams({ package: slug });
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = getFirstQueryValue(query[key]);
    if (value) {
      assessmentQuery.set(key, value);
    }
  }
  const assessmentHref = `/assessment?${assessmentQuery.toString()}`;

  const locationFilter =
    pkg.location === "Medellín"
      ? "Medellín"
      : pkg.location === "Manizales"
        ? "Manizales"
        : undefined;

  const categories =
    slug === "smile-manizales" ? ["finca", "lodging", "tour"] : ["clinic", "lodging", "tour"];

  const packageAssets = await getPublishedAssets({
    location: locationFilter,
    limit: 8,
  });

  const filteredAssets =
    packageAssets?.filter(
      (a) => a.category && categories.includes(a.category),
    ) ?? [];

  const depositFormatted =
    pkg.deposit_cents != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
          pkg.deposit_cents / 100,
        )
      : null;
  const included = pkg.included ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/packages" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            ← All packages
          </Link>
          <Link href="/" className="ml-3 text-sm font-medium text-zinc-500 hover:text-zinc-900">
            {branding.productName}
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">{pkg.name}</h1>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            {[pkg.location, pkg.recovery_city].filter(Boolean).join(" → ") || "Colombia"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Summary card */}
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          {pkg.description && (
            <p className="text-zinc-700 leading-relaxed">{pkg.description}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-6 border-t border-zinc-100 pt-6">
            {(pkg.recovery_city ?? pkg.origin_city ?? pkg.destination_city) && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Journey</span>
                <p className="mt-0.5 font-medium text-zinc-900">
                  {pkg.origin_city && pkg.destination_city
                    ? `${pkg.origin_city} → ${pkg.destination_city}`
                    : pkg.recovery_city
                      ? `${pkg.location ?? ""} · Recovery in ${pkg.recovery_city}`
                      : pkg.location}
                </p>
              </div>
            )}
            {pkg.duration_days != null && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Duration</span>
                <p className="mt-0.5 font-medium text-zinc-900">{pkg.duration_days} days</p>
              </div>
            )}
            {depositFormatted && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Deposit</span>
                <p className="mt-0.5 font-semibold text-emerald-700">{depositFormatted}</p>
              </div>
            )}
            {pkg.badge && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {pkg.badge}
              </span>
            )}
          </div>
        </section>

        {filteredAssets.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Gallery</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {filteredAssets.slice(0, 6).map((asset) =>
                asset.url ? (
                  <li
                    key={asset.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.alt_text ?? asset.title ?? "Package image"}
                      className="h-44 w-full object-cover"
                    />
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        )}

        {included.length > 0 && (
          <section className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">What&apos;s included</h2>
            <p className="mt-1 text-sm text-zinc-600">Your package covers the following.</p>
            <ul className="mt-4 space-y-2">
              {included.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-zinc-700">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold" aria-hidden>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {pkg.itinerary_outline && (
          <section className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Journey outline</h2>
            <p className="mt-1 text-sm text-zinc-600">Non-medical steps we coordinate for you.</p>
            <div className="mt-4 whitespace-pre-line rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
              {pkg.itinerary_outline}
            </div>
          </section>
        )}

        <section className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
          <p className="text-sm text-zinc-600">
            Verified clinics in Medellín and Manizales. Secure payments. Concierge support from {branding.productName}.
          </p>
        </section>

        <section className="rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-8 text-center shadow-sm md:p-10">
          <h2 className="text-xl font-bold text-zinc-900">Ready to start your journey?</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Complete our free assessment. We&apos;ll review your case and coordinate next steps—no commitment.
          </p>
          <Link
            href={assessmentHref}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-600 px-8 font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Start free assessment
          </Link>
          <Link
            href="/packages"
            className="mt-3 block text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Compare all packages
          </Link>
        </section>
      </main>
    </div>
  );
}

