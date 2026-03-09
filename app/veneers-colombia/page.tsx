import Link from "next/link";
import type { Metadata } from "next";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Veneers in Colombia | Hollywood Smile | MedVoyage Smile",
  description:
    "Get a Hollywood smile with veneers in Colombia. Trusted clinics in Medellín and Manizales, concierge coordination, and secure online deposit.",
  openGraph: {
    title: "Veneers in Colombia — MedVoyage Smile",
    description:
      "Premium veneer makeovers in Colombia with vetted clinics, aesthetic specialists, and full travel coordination.",
  },
};

export default function VeneersColombiaPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-zinc-100 hover:text-white">
            {branding.productName}
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/packages" className="text-xs font-medium text-zinc-400 hover:text-white">
              Packages
            </Link>
            <Link href="/assessment" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              Start free evaluation
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {/* Hero */}
        <section className="mb-16 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Veneers · Hollywood smile
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Veneers in Colombia —{" "}
              <span className="text-emerald-400">Hollywood smile without Hollywood prices</span>
            </h1>
            <p className="mt-4 text-base text-zinc-300 sm:text-lg">
              Transform your smile with veneers in Medellín or Manizales. Work with aesthetic specialists,
              modern clinics, and a concierge team that coordinates your entire journey.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/assessment"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-900 shadow-md hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Start Free Smile Evaluation
              </Link>
              <Link
                href="/packages"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-600 px-8 py-3 text-sm font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-900/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                View Packages
              </Link>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Free evaluation · No commitment · Response within 24 hours
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 sm:p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Why choose Colombia for veneers
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-200">
              <li>
                <span className="font-semibold text-emerald-400">Save significantly</span> on full smile
                makeovers compared to U.S. and European prices.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Aesthetic specialists</span> experienced in
                veneers, smile design, and digital planning.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Modern technology</span> for color matching,
                minimal preparation, and natural‑looking results.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Medellín &amp; Manizales</span> as your
                treatment and recovery cities, with optional tourism.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Concierge guidance</span> so you don&apos;t
                have to navigate the process alone.
              </li>
            </ul>
          </div>
        </section>

        {/* Treatment overview */}
        <section className="mb-16 grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Veneers and Hollywood smile</h2>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Veneers are thin porcelain or composite shells bonded to the front of your teeth to improve
              color, shape, and symmetry. They are ideal if you want a brighter, more aligned smile without
              full orthodontic treatment.
            </p>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              A Hollywood smile makeover can combine veneers with whitening, contouring, and other aesthetic
              treatments. The right plan depends on your current smile, bite, and goals—your specialist will
              design a personalized approach.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Typical journey for veneers
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>
                <span className="font-semibold text-zinc-100">Before you travel</span> — share photos and
                goals; get a preliminary aesthetic plan and cost range.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Days 1–2</span> — arrival, in‑person consultation,
                shade selection, and digital planning.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Days 3–5</span> — tooth preparation if needed,
                impressions or scans, and temporaries placed.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Days 6–10</span> — final veneers try‑in and
                bonding, smile checks, and adjustments.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">After you return</span> — remote follow‑up and
                local dental check‑ups as recommended.
              </li>
            </ul>
          </div>
        </section>

        {/* Why MedVoyage Smile */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Why {branding.productName} for your veneer journey
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            {branding.productName} connects you with vetted aesthetic dentists and clinics in Colombia and
            coordinates the steps from evaluation to recovery.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Smile design focus</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Work with professionals who focus on veneers, smile design, and cosmetic dentistry, not just
                general procedures.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Concierge support</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Get help coordinating appointments, timing, and city choice between Medellín and Manizales.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Secure deposit</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Reserve your treatment dates via Stripe, with clear deposit amounts and conditions.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Fast evaluation</h3>
              <p className="mt-2 text-xs text-zinc-400">
                After your assessment, we typically respond within one business day with options for your
                Hollywood smile.
              </p>
            </div>
          </div>
        </section>

        {/* Related packages */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Related veneer journeys</h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Choose a curated journey that includes aesthetic treatment, lodging coordination, and recovery
            support.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Comfort Recovery Journey</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Popular for veneer and Hollywood smile makeovers, with accommodation and recovery support.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                <span className="rounded-full bg-zinc-800 px-3 py-1">Medellín → Manizales</span>
                <span className="rounded-full bg-zinc-800 px-3 py-1">10 days</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/packages/comfort-recovery-journey"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
                >
                  View package
                </Link>
                <Link
                  href="/assessment?package=comfort-recovery-journey"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200"
                >
                  Start with this package
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Premium Transformation Experience</h3>
              <p className="mt-2 text-xs text-zinc-400">
                All‑inclusive aesthetic transformation with premium lodging and private transport.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                <span className="rounded-full bg-zinc-800 px-3 py-1">Medellín → Manizales</span>
                <span className="rounded-full bg-zinc-800 px-3 py-1">12 days</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/packages/premium-transformation-experience"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
                >
                  View package
                </Link>
                <Link
                  href="/assessment?package=premium-transformation-experience"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200"
                >
                  Start with this package
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Veneers in Colombia — FAQ
          </h2>
          <div className="mt-6 space-y-4 text-sm text-zinc-300">
            <div>
              <h3 className="font-semibold text-white">
                How much do veneers cost in Colombia?
              </h3>
              <p className="mt-1 text-zinc-300">
                Cost depends on the number of veneers, materials, and clinic. Many patients see meaningful
                savings compared to U.S. prices. After your evaluation, you&apos;ll receive a personalized
                range.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">How long do I need to stay?</h3>
              <p className="mt-1 text-zinc-300">
                Many veneer journeys are planned for about 7–10 days. Your specialist will confirm ideal
                timing and whether a follow‑up visit is recommended.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Is the evaluation free?</h3>
              <p className="mt-1 text-zinc-300">
                Yes. Assessment and initial planning are free and non‑binding. You only pay a deposit once
                you decide to move forward with a package.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Is it safe to get veneers abroad?</h3>
              <p className="mt-1 text-zinc-300">
                There are always risks with any dental procedure. We focus on vetted clinics and specialists
                and encourage you to review all recommendations and ask questions before committing.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-16">
          <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Start Your Free Veneers Evaluation
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-300 sm:text-base">
              Share your goals for a Hollywood smile and we&apos;ll connect you with vetted veneer specialists
              in Colombia.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/assessment"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-900 shadow-md hover:bg-zinc-200"
              >
                Start Free Smile Evaluation
              </Link>
              <Link
                href="/packages"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-zinc-600 px-8 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
              >
                View Packages
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

