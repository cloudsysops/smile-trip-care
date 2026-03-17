import Link from "next/link";
import { branding } from "@/lib/branding";

export const metadata = {
  title: `Trust & safety | ${branding.productName}`,
  description: "How we vet clinics, specialists, and hosts, and how we coordinate safe medical travel to Colombia.",
};

export default function TrustAndSafetyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white">
            ← Back to home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Trust &amp; safety
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        <section className="mb-10">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-white md:text-4xl">
            Trust, safety, and how we vet our network
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-zinc-300 md:text-base">
            {branding.productName} is not an open marketplace. We work with a curated network of clinics, specialists,
            and partners in Medellín and Manizales. This page explains how we review partners, how your journey is
            coordinated, and how to reach us if something feels off.
          </p>
        </section>

        <section className="mb-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              How we vet clinics &amp; specialists
            </h2>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• We start from existing clinical references, not anonymous applications.</li>
              <li>• Clinics and specialists must have a physical presence and verifiable track record.</li>
              <li>• We review credentials, publicly available information, and institutional context.</li>
              <li>• We focus on fit for international patients: communication, transparency, and follow‑up.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              How we vet hosts &amp; experiences
            </h2>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• Hosts and experiences are invite‑only or referred by trusted partners.</li>
              <li>• We look for clear descriptions, house rules, and realistic expectations.</li>
              <li>• Experiences must fit a recovery‑first mindset: comfort, safety, and calm.</li>
              <li>• All supply is subject to admin approval before it appears in the marketplace.</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Approval and verification model
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h3 className="mb-1 text-sm font-semibold text-white">Curated, not open listing</h3>
              <p className="text-sm text-zinc-300">
                New clinics, specialists, hosts, and experiences enter the system through referrals and internal review.
                There is no public “list your service” form.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h3 className="mb-1 text-sm font-semibold text-white">Admin approval required</h3>
              <p className="text-sm text-zinc-300">
                Every specialist, host, and experience has an approval status. Only approved and published items are
                visible to patients in the marketplace and builder.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h3 className="mb-1 text-sm font-semibold text-white">Ongoing curation</h3>
              <p className="text-sm text-zinc-300">
                We monitor feedback and outcomes. Partners can be paused or removed if quality, communication, or safety
                expectations are not met.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Family‑hosted experience standards
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <p className="text-sm text-zinc-300">
                Family‑hosted stays are designed to feel warm and local, but they must still meet clear expectations:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                <li>• Transparent description of rooms and shared spaces.</li>
                <li>• Clear house rules and quiet hours.</li>
                <li>• Basic privacy and safety standards (locks, access control).</li>
                <li>• Realistic photos and descriptions reviewed by our team.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <p className="text-sm text-zinc-300">
                Hosts are part of a curated network. We aim for:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                <li>• Orientation and support on arrival and during recovery.</li>
                <li>• Respectful, non‑intrusive hospitality.</li>
                <li>• Alignment with medical recovery needs (rest first, tourism second).</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Medical coordination standards
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-sm text-zinc-300">
              We coordinate the journey; licensed clinics and specialists provide diagnosis and treatment. In practice:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-300">
              <li>• You always have the right to ask questions, request clarifications, or seek a second opinion.</li>
              <li>• Treatment decisions are made between you and your clinical team, not by coordinators.</li>
              <li>• We help you understand logistics, timelines, and what to expect before and after treatment.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Medical disclaimer: we coordinate travel, hospitality, and communication. Medical advice, diagnosis, and
              treatment are provided by licensed professionals in Colombia, who remain responsible for clinical care.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Support and escalation
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-sm text-zinc-300">
              If something does not feel right before or during your journey, we want to hear from you.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-300">
              <li>• Before travel: reply to your coordinator or use WhatsApp to share your concern.</li>
              <li>• During your stay: contact your coordinator and clinic immediately to align on next steps.</li>
              <li>• After your trip: share feedback via the in‑app feedback button or email so we can improve and act.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              This page is not a substitute for emergency services. In a medical emergency, always contact local
              emergency numbers or seek urgent care immediately.
            </p>
          </div>
        </section>

        <section className="mb-4 border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <p>
            Next:{" "}
            <Link href="/how-payments-work" className="text-emerald-400 hover:text-emerald-300">
              How payments and deposits work →
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

