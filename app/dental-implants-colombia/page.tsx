import Link from "next/link";
import type { Metadata } from "next";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Dental Implants in Colombia | Save up to 70% | MedVoyage Smile",
  description:
    "Get world-class dental implants in Medellín and Manizales with trusted clinics, international patient support, and up to 70% savings vs the U.S.",
  openGraph: {
    title: "Dental Implants in Colombia — MedVoyage Smile",
    description:
      "Premium dental implants in Colombia with vetted clinics, concierge coordination, and secure online deposit.",
  },
};

export default function DentalImplantsColombiaPage() {
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
              Dental implants · Colombia
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Dental Implants in Colombia —{" "}
              <span className="text-emerald-400">Save up to 70% vs U.S.</span>
            </h1>
            <p className="mt-4 text-base text-zinc-300 sm:text-lg">
              Get world-class dental implants in Medellín and Manizales with trusted clinics, modern
              facilities, and international patient support—all coordinated through {branding.productName}.
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
              Why patients choose Colombia
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-zinc-200">
              <li>
                <span className="font-semibold text-emerald-400">50–70% lower cost</span> compared to many
                U.S. and European clinics, with high-quality materials and technology.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Experienced specialists</span> with training
                in implantology and restorative dentistry.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Modern clinics</span> in Medellín and
                Manizales, with digital planning and advanced equipment.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Travel + treatment combined</span> in a
                single, coordinated journey.
              </li>
              <li>
                <span className="font-semibold text-emerald-400">Concierge coordination</span> so you are not
                alone with logistics, schedules, or local details.
              </li>
            </ul>
          </div>
        </section>

        {/* Treatment overview */}
        <section className="mb-16 grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Dental implants — overview</h2>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              Dental implants replace missing teeth with titanium posts and lifelike crowns. They are a
              long-term solution when you have one or more missing teeth, or when you want more stability
              than removable dentures.
            </p>
            <p className="mt-3 text-sm text-zinc-300 sm:text-base">
              In a typical journey, you&apos;ll have a consultation, digital planning, implant placement, and
              follow-up. Many cases require two visits months apart, while others can be planned in a single
              extended stay depending on bone, health, and your specialist&apos;s protocol.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Typical travel &amp; treatment timeline
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              <li>
                <span className="font-semibold text-zinc-100">Before you travel</span> — share your photos,
                X-rays, and goals through our free assessment.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Days 1–2</span> — arrival in Medellín,
                in‑person consultation, scans, and final planning.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Days 3–5</span> — implant surgery and immediate
                post‑op checks.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">Days 6–10</span> — recovery, light tourism, or
                transfer to Manizales for a calmer stay.
              </li>
              <li>
                <span className="font-semibold text-zinc-100">After you return home</span> — remote follow‑up
                and, if needed, a second visit for final prosthetics.
              </li>
            </ul>
          </div>
        </section>

        {/* Why MedVoyage Smile */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Why {branding.productName}</h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            {branding.productName} is not a generic directory. We work with a small, vetted network of
            clinics and specialists in Colombia and coordinate your journey end‑to‑end.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Curated clinics</h3>
              <p className="mt-2 text-xs text-zinc-400">
                We partner with selected clinics in Medellín and Manizales, reviewed for quality, facilities,
                and patient experience.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">International coordination</h3>
              <p className="mt-2 text-xs text-zinc-400">
                From assessment to return flight, our team helps with timing, clinic scheduling, and
                questions about staying in Colombia.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Secure deposits</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Deposits are processed via Stripe, a leading global payments platform, so you can reserve
                your spot with confidence.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Response within 24 hours</h3>
              <p className="mt-2 text-xs text-zinc-400">
                After you submit your assessment, we usually respond within one business day with options
                and next steps.
              </p>
            </div>
          </div>
        </section>

        {/* Related packages */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Related implant journeys</h2>
          <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
            Start with a curated travel + treatment journey that includes your implant work, recovery, and
            coordination between Medellín and Manizales.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <h3 className="text-sm font-semibold text-white">Essential Care Journey</h3>
              <p className="mt-2 text-xs text-zinc-400">
                Focused implant and restorative care in Medellín with recovery support in Manizales.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                <span className="rounded-full bg-zinc-800 px-3 py-1">Medellín → Manizales</span>
                <span className="rounded-full bg-zinc-800 px-3 py-1">8 days</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/packages/essential-care-journey"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-zinc-600 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-900"
                >
                  View package
                </Link>
                <Link
                  href="/assessment?package=essential-care-journey"
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
            Dental implants in Colombia — FAQ
          </h2>
          <div className="mt-6 space-y-4 text-sm text-zinc-300">
            <div>
              <h3 className="font-semibold text-white">
                How much do dental implants cost in Colombia?
              </h3>
              <p className="mt-1 text-zinc-300">
                Pricing depends on the number of implants, type of prosthetics, bone grafting, and clinic.
                Many patients see savings of 50–70% vs comparable treatment in the U.S. Your free assessment
                and specialist review will give you a personalized range.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">How long do I need to stay?</h3>
              <p className="mt-1 text-zinc-300">
                Many implant trips are planned for 7–10 days for surgery and early recovery. Complex cases
                may require a second visit months later. We help you plan dates with your specialist.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Is the evaluation really free?</h3>
              <p className="mt-1 text-zinc-300">
                Yes. Sharing your goals, photos, and basic history is free and without commitment. You only
                pay a deposit if you decide to move forward with a package and secure dates.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white">Is it safe to get dental implants in Colombia?</h3>
              <p className="mt-1 text-zinc-300">
                We work with clinics that follow international standards for sterilization, planning, and
                follow‑up. As with any medical decision, you should review the recommendations and ask
                questions; our role is to connect you with vetted professionals and support your journey.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-16">
          <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Start Your Free Dental Implants Evaluation
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-300 sm:text-base">
              Share your goals and we&apos;ll connect you with vetted clinics in Colombia for a personalized
              treatment plan and savings estimate.
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

