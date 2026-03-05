import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPackageBySlug } from "@/lib/packages";
import { getPublishedAssets } from "@/lib/assets";

type Props = { params: Promise<{ slug: string }> };

export default async function PackagePage({ params }: Props) {
  const { slug } = await params;
  const pkg = await getPublishedPackageBySlug(slug);
  if (!pkg) notFound();

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
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            ← Smile Transformation
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">{pkg.name}</h1>
          <p className="text-sm text-zinc-600">{pkg.location}</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        {pkg.description && (
          <section className="mb-8">
            <p className="text-zinc-700">{pkg.description}</p>
          </section>
        )}

        {filteredAssets.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold">Gallery</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {filteredAssets.slice(0, 6).map((asset) =>
                asset.url ? (
                  <li
                    key={asset.id}
                    className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.alt_text ?? asset.title ?? "Package image"}
                      className="h-40 w-full object-cover"
                    />
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        )}

        <section className="mb-8 flex flex-wrap gap-6 text-sm">
          {pkg.duration_days != null && (
            <div>
              <span className="font-medium text-zinc-500">Duration</span>
              <p className="mt-1">{pkg.duration_days} days</p>
            </div>
          )}
          {depositFormatted && (
            <div>
              <span className="font-medium text-zinc-500">Deposit</span>
              <p className="mt-1">{depositFormatted}</p>
            </div>
          )}
        </section>

        {included.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold">Included</h2>
            <ul className="mt-2 list-inside list-disc text-zinc-700">
              {included.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {pkg.itinerary_outline && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold">Itinerary outline (non-medical)</h2>
            <p className="mt-2 whitespace-pre-line text-zinc-700">{pkg.itinerary_outline}</p>
          </section>
        )}

        <section className="rounded-xl border-2 border-emerald-600 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">Ready to start?</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Complete the assessment and we&apos;ll coordinate next steps.
          </p>
          <Link
            href="/assessment"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Go to assessment
          </Link>
        </section>
      </main>
    </div>
  );
}

