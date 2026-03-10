import Link from "next/link";
import type { Metadata } from "next";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Hollywood Smile in Colombia | Veneers & Smile Design | MedVoyage Smile",
  description:
    "Plan your Hollywood smile makeover in Colombia with veneers and aesthetic dentistry. Trusted clinics, international coordination, and secure deposit.",
  openGraph: {
    title: "Hollywood Smile in Colombia — MedVoyage Smile",
    description:
      "Premium Hollywood smile makeovers in Medellín and Manizales with vetted clinics and concierge support.",
  },
};

export default function HollywoodSmileColombiaPage() {
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

      <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        {/* Hero */}
        <section className="mb-20 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Hollywood smile · Colombia
            </p>
            <h1 className="mt-3 font-serif text-3xl font-normal tracking-tight text-white sm:text-4xl md:text-5xl">
              Hollywood Smile in Colombia —{" "}
              <span className="text-emerald-400">Veneers and smile design in Medellín &amp; Manizales</span>
            </h1>
            <p className="mt-4 text-base text-zinc-300 sm:text-lg">
              Work with aesthetic specialists in Colombia to plan a Hollywood smile makeover that fits your
              goals, budget, and travel dates—coordinated by {branding.productName}.
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
              Why plan your Hollywood smile in Colombia
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-200">
              <li>
                <span className="font-semibold text-emerald-400">Transformational results</span> with veneers,
                whitening, contouring, and other smile design treatments.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Significant savings</span> compared to many
                major cities, while working in modern clinics.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Destination experience</span> in Medellín and
                Manizales, combining treatment and recovery with travel.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Guided planning</span> so you understand
                options before committing.
              </li>
            </ul>
          </div>
        </section>

        {/* Treatment overview */}
        <section className="mb-20 grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">What is a Hollywood smile?</h2>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              A Hollywood smile is a customized smile makeover that often combines veneers, whitening, contouring,
              and sometimes orthodontics or other procedures. The goal is a brighter, more harmonious smile that
              still feels like you.
            </p>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Your specialist will evaluate your teeth, gums, and bite to recommend the safest and most effective
              plan for your starting point and expectations.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Who is a good candidate?
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>People with discoloration or stains that whitening alone can&apos;t address.</li>
              <li>Small chips, gaps, or uneven edges that could be improved with veneers or bonding.</li>
              <li>Patients who want a coordinated plan rather than isolated, one‑off treatments.</li>
              <li>People willing to invest time in planning and follow‑up with their aesthetic dentist.</li>
            </ul>
          </div>
        </section>

        {/* Why MedVoyage Smile */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Why {branding.productName} for your Hollywood smile
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            {branding.productName} curates clinics and specialists who focus on aesthetics and smile design, not
            just general dentistry. We coordinate your journey, so your smile makeover fits into a clear plan.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Curated aesthetic partners</h3>
              <p className="mt-2 text-xs text-zinc-400">
                We work with selected clinics and specialists experienced in cosmetic and smile design work.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Coordinated journey</h3>
              <p className="mt-2 text-xs text-zinc-400">
                From your first assessment to your final check‑up in Colombia, we help coordinate each step.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Transparent deposits</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Deposits are processed via Stripe with clear amounts and terms, so you can reserve treatment
                dates confidently.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Quick response</h3>
              <p className="mt-2 text-xs text-zinc-400">
                We usually respond within one business day with proposed paths to your Hollywood smile.
              </p>
            </div>
          </div>
        </section>

        {/* Related packages */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Related Hollywood smile journeys</h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Choose a journey that includes aesthetic treatment, travel coordination, and curated recovery
            experiences.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Comfort Recovery Journey</h3>
              <p className="mt-2 text-xs text-zinc-400">
                A popular choice for smile makeovers with recovery in the coffee region.
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
                For full Hollywood smile transformations with premium lodging and private transport.
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
            Hollywood smile in Colombia — FAQ
          </h2>
          <div className="mt-6 space-y-4 text-sm text-zinc-300">
            <div>
              <h3 className="font-semibold text-white">How much does a Hollywood smile cost?</h3>
              <p className="mt-1 text-zinc-300">
                It depends on the number of teeth involved, whether veneers are used, and any additional
                treatments. Many patients see substantial savings compared to major U.S. cities. Your free
                assessment is the first step to get a personalized quote.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">How long do I need to stay in Colombia?</h3>
              <p className="mt-1 text-zinc-300">
                Many cases are planned for about 7–12 days. Complex cases or combined treatments can require
                more time or a second visit. We help you design the right window with your clinic.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Is the evaluation really free?</h3>
              <p className="mt-1 text-zinc-300">
                Yes. Assessment and initial planning are free. You only pay if you decide to move forward
                with a package and reserve dates with a deposit.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Can I combine veneers with other treatments?</h3>
              <p className="mt-1 text-zinc-300">
                Often yes. Your specialist will advise on combining veneers with whitening, contouring,
                implants, or orthodontics depending on your case.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-16">
          <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Start Your Hollywood Smile Evaluation
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-300 sm:text-base">
              Share your goals for your dream smile and we&apos;ll connect you with vetted clinics in Colombia
              with clear next steps.
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

