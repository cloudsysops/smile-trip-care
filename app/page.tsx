import Link from "next/link";
import { getPublishedPackages } from "@/lib/packages";
import { getPublishedAssets } from "@/lib/assets";

function formatDeposit(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function Home() {
  const packages = await getPublishedPackages();
  const assets = await getPublishedAssets({ limit: 12 });

  const prioritized = [...assets].sort((a, b) => {
    const score = (x: { category: string | null }) =>
      x.category === "clinic" || x.category === "team" ? 1 : 0;
    return score(b) - score(a);
  });

  const featured = prioritized.slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <span className="text-lg font-semibold">Smile Transformation</span>
          <nav>
            <Link
              href="/assessment"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Start your journey
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <section className="mb-20 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Premium health &amp; tourism coordination
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Medellín and Manizales experiences with Clínica San Martín — family-run specialists,
            family lodging, and seamless transport. No medical promises; we coordinate your trip.
          </p>
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Get started
          </Link>
        </section>

        <section className="mb-20">
          <h2 className="mb-2 text-2xl font-semibold">Our partner</h2>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            <strong>Clínica San Martín</strong> — Trust anchor for your stay: family-run specialists,
            family lodging, and internal transport. Medical services are billed by the clinic in
            Colombia.
          </p>
        </section>

        {featured.length > 0 && (
          <section className="mb-20">
            <h2 className="mb-6 text-2xl font-semibold">Gallery</h2>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {featured.map((a) =>
                a.url ? (
                  <li
                    key={a.id}
                    className="aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.alt_text ?? a.title ?? "Gallery image"}
                      className="h-full w-full object-cover"
                    />
                  </li>
                ) : null,
              )}
            </ul>
          </section>
        )}

        <section className="mb-20">
          <h2 className="mb-6 text-2xl font-semibold">Packages</h2>
          {packages.length === 0 ? (
            <p className="text-zinc-500">
              No packages available at the moment. Check back soon.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <h3 className="mb-1 text-lg font-semibold">{pkg.name}</h3>
                  <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">{pkg.location}</p>
                  {pkg.description && (
                    <p className="mb-4 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {pkg.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    {pkg.duration_days != null && <span>{pkg.duration_days} days</span>}
                    <span>Deposit {formatDeposit(pkg.deposit_cents)}</span>
                  </div>
                  {Array.isArray(pkg.included) && pkg.included.length > 0 && (
                    <ul className="mt-3 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-400">
                      {pkg.included.slice(0, 3).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/assessment?package=${encodeURIComponent(pkg.slug)}`}
                    className="mt-4 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    Request info →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          USA LLC — International coordination &amp; hospitality. Medical services billed by
          clinics in Colombia.
        </footer>
      </main>
    </div>
  );
}

