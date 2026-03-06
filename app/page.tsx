import Link from "next/link";
import { getPublishedPackages } from "@/lib/packages";
import { getPublishedAssets } from "@/lib/assets";

const HOW_IT_WORKS = [
  {
    title: "1) Complete your assessment",
    description:
      "Share your goals, dates, and preferences. It takes under 3 minutes and helps our team prepare your options.",
  },
  {
    title: "2) Receive a personalized coordination plan",
    description:
      "We match you with the right destination and logistics: clinic coordination, lodging, and local transport.",
  },
  {
    title: "3) Confirm your dates and travel confidently",
    description:
      "After your deposit, we finalize your itinerary so your arrival and recovery flow smoothly.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Everything felt organized from day one. Transfers, lodging, and communication were clear and fast.",
    author: "Maria G.",
    context: "Miami, FL",
  },
  {
    quote:
      "I loved having one team coordinate the full experience. It saved me time and reduced stress.",
    author: "Jordan T.",
    context: "Houston, TX",
  },
  {
    quote:
      "The process was professional and transparent. I always knew what was next before I traveled.",
    author: "Sofia R.",
    context: "New York, NY",
  },
] as const;

const FAQS = [
  {
    q: "What does Smile Transformation coordinate?",
    a: "We coordinate hospitality and logistics around your trip: destination planning, lodging support, transportation, and timeline guidance.",
  },
  {
    q: "Do you provide medical treatment?",
    a: "No. Medical treatment is provided and billed by licensed clinics in Colombia. We focus on coordination and experience.",
  },
  {
    q: "How long does the process take?",
    a: "Most clients complete assessment and planning quickly. Exact trip duration depends on your selected package and clinic plan.",
  },
  {
    q: "When do I pay a deposit?",
    a: "After admin review, we send a secure Stripe payment link for your coordination deposit.",
  },
] as const;

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
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  const whatsappHref = whatsappNumber.length > 0
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I want information about Smile Transformation packages.")}`
    : "/assessment";

  const prioritized = [...assets].sort((a, b) => {
    const score = (x: { category: string | null }) =>
      x.category === "clinic" || x.category === "team" ? 1 : 0;
    return score(b) - score(a);
  });

  const featured = prioritized.slice(0, 6);

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-lg font-semibold">Smile Transformation</span>
          <nav className="flex items-center gap-2">
            <Link
              href={whatsappHref}
              target={whatsappHref.startsWith("https://") ? "_blank" : undefined}
              rel={whatsappHref.startsWith("https://") ? "noopener noreferrer" : undefined}
              className="hidden rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:inline-flex dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              WhatsApp
            </Link>
            <Link
              href="/assessment"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Free assessment
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="mb-14 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              Trusted coordination for international patients
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Plan your smile journey with premium, stress-free coordination
            </h1>
            <p className="mb-6 max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
              We coordinate your experience in Medellín and Manizales: destination planning,
              hospitality, and logistics in partnership with Clínica San Martín. No medical
              promises — just clear, professional coordination.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-8 py-4 text-base font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Start free assessment
              </Link>
              <Link
                href={whatsappHref}
                target={whatsappHref.startsWith("https://") ? "_blank" : undefined}
                rel={whatsappHref.startsWith("https://") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-8 py-4 text-base font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Chat on WhatsApp
              </Link>
            </div>
            <ul className="mt-6 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
              <li>✓ Fast response from admin team</li>
              <li>✓ Personalized city/package guidance</li>
              <li>✓ Lodging and transport coordination</li>
              <li>✓ Secure Stripe deposit flow</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Why clients choose Smile Transformation</h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
              <li>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Premium support:</span>{" "}
                One team coordinating your full non-medical experience.
              </li>
              <li>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Clear process:</span>{" "}
                Structured steps from assessment to arrival.
              </li>
              <li>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Trusted partner:</span>{" "}
                Clínica San Martín as coordination anchor in Colombia.
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold">Our partner</h2>
          <p className="mb-6 max-w-4xl text-zinc-600 dark:text-zinc-400">
            <strong>Clínica San Martín</strong> — Trust anchor for your stay: family-run specialists,
            family lodging, and internal transport. Medical services are billed by the clinic in
            Colombia.
          </p>
        </section>

        {featured.length > 0 && (
          <section className="mb-14">
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

        <section className="mb-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">Packages</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Premium coordination options</p>
          </div>
          {packages.length === 0 ? (
            <p className="text-zinc-500">
              No packages available at the moment. Check back soon.
            </p>
          ) : (
            <ul className="grid gap-6 lg:grid-cols-2">
              {packages.map((pkg) => (
                <li
                  key={pkg.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{pkg.name}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{pkg.location}</p>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      Deposit {formatDeposit(pkg.deposit_cents)}
                    </span>
                  </div>
                  {pkg.description && (
                    <p className="mb-4 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {pkg.description}
                    </p>
                  )}
                  <div className="mb-4 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    {pkg.duration_days != null && (
                      <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
                        {pkg.duration_days} days
                      </span>
                    )}
                    <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
                      Coordination package
                    </span>
                  </div>
                  {Array.isArray(pkg.included) && pkg.included.length > 0 && (
                    <ul className="mt-3 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-400">
                      {pkg.included.slice(0, 3).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/packages/${encodeURIComponent(pkg.slug)}`}
                      className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      View details
                    </Link>
                    <Link
                      href={`/assessment?package=${encodeURIComponent(pkg.slug)}`}
                      className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Start assessment
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-semibold">How it works</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <li
                key={step.title}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-semibold">Testimonials</h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <li
                key={item.author}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-sm text-zinc-700 dark:text-zinc-300">&ldquo;{item.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold">{item.author}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.context}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-semibold">FAQ</h2>
          <div className="space-y-3">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <summary className="cursor-pointer text-sm font-semibold">{item.q}</summary>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          USA LLC — International coordination &amp; hospitality. Medical services billed by
          clinics in Colombia.
        </footer>
      </main>

      <Link
        href={whatsappHref}
        target={whatsappHref.startsWith("https://") ? "_blank" : undefined}
        rel={whatsappHref.startsWith("https://") ? "noopener noreferrer" : undefined}
        className="fixed bottom-24 right-4 z-40 inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 sm:right-6"
        aria-label="Chat on WhatsApp"
      >
        WhatsApp
      </Link>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="hidden text-sm text-zinc-600 sm:block dark:text-zinc-300">
            Ready to start? Get your personalized plan today.
          </p>
          <Link
            href="/assessment"
            className="ml-auto inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Start free assessment
          </Link>
        </div>
      </div>
    </div>
  );
}

