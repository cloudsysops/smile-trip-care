import Link from "next/link";
import { getPublishedPackages } from "@/lib/packages";

function formatDeposit(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function Home() {
  const packages = await getPublishedPackages();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-6 flex justify-between items-center">
          <span className="font-semibold text-lg">Smile Transformation</span>
          <nav>
            <Link
              href="/assessment"
              className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-sm font-medium hover:opacity-90"
            >
              Start your journey
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <section className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Premium health & tourism coordination
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8">
            Medellín and Manizales experiences with Clínica San Martín — family-run specialists,
            family lodging, and seamless transport. No medical promises; we coordinate your trip.
          </p>
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-4 text-base font-medium hover:opacity-90"
          >
            Get started
          </Link>
        </section>

        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-2">Our partner</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            <strong>Clínica San Martín</strong> — Trust anchor for your stay: family-run specialists,
            family lodging, and internal transport. Medical services are billed by the clinic in Colombia.
          </p>
        </section>

        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-6">Packages</h2>
          {packages.length === 0 ? (
            <p className="text-zinc-500">No packages available at the moment. Check back soon.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
                >
                  <h3 className="font-semibold text-lg mb-1">{pkg.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">{pkg.location}</p>
                  {pkg.description && (
                    <p className="text-zinc-600 dark:text-zinc-300 text-sm mb-4 line-clamp-3">
                      {pkg.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    {pkg.duration_days != null && <span>{pkg.duration_days} days</span>}
                    <span>Deposit {formatDeposit(pkg.deposit_cents)}</span>
                  </div>
                  {Array.isArray(pkg.included) && pkg.included.length > 0 && (
                    <ul className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                      {pkg.included.slice(0, 3).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/assessment?package=${encodeURIComponent(pkg.slug)}`}
                    className="mt-4 inline-block text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                  >
                    Request info →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          USA LLC — International coordination & hospitality. Medical services billed by clinics in Colombia.
        </footer>
      </main>
    </div>
  );
}
