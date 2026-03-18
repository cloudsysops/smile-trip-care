import Link from "next/link";
import { branding } from "@/lib/branding";

export const metadata = {
  title: `Our clinical network | ${branding.productName}`,
  description: `${branding.productName} explains how we select clinics and specialists in Medellín and Manizales, and how treatment packages are curated.`,
};

export default function OurClinicalNetworkPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white">
            ← Back to home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Clinical network
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        <section className="mb-10">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-white md:text-4xl">
            Our clinical network in Medellín and Manizales
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-zinc-300 md:text-base">
            {branding.productName} collaborates with a small, curated group of clinics and specialists in Colombia. This
            page explains how we select partners, how treatment packages are built, and what “trusted network” means in
            practice.
          </p>
        </section>

        <section className="mb-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              How specialists are selected
            </h2>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>• Professional references and clinical reputation in Colombia.</li>
              <li>• Alignment with our treatment focus (oral health and smile design).</li>
              <li>• Willingness to work with international patients and clear communication.</li>
              <li>• Verification of credentials and experience via public and institutional sources.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Role of clinics and providers
            </h2>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>• Provide facilities, teams, and clinical protocols.</li>
              <li>• Own medical decisions, diagnosis, and treatment plans.</li>
              <li>• Coordinate post‑operative follow‑up with you directly.</li>
              <li>• Work with our coordinators to align treatment and travel logistics.</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            How treatment packages are curated
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <ol className="space-y-3 text-sm text-zinc-300">
              <li>
                <strong className="text-zinc-100">1. Clinical scope first.</strong>
                <br />
                We start from clinical needs (implants, smile design, combined procedures) and design packages that make
                sense medically.
              </li>
              <li>
                <strong className="text-zinc-100">2. Travel and recovery next.</strong>
                <br />
                We add logistics: city choice, approximate duration, and recommended recovery environment.
              </li>
              <li>
                <strong className="text-zinc-100">3. Experiences as optional extras.</strong>
                <br />
                Tours and experiences are optional and come after treatment and recovery planning—not before.
              </li>
              <li>
                <strong className="text-zinc-100">4. Continuous refinement.</strong>
                <br />
                As we gather more data and feedback, packages evolve. We prefer a few solid options over a long list of
                generic bundles.
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Medellín and Manizales: complementary roles
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h3 className="mb-1 text-sm font-semibold text-white">Medellín</h3>
              <p className="text-sm text-zinc-300">
                A major urban center with modern clinics and a wide range of specialists. Many treatment plans start
                here, with access to advanced technology and multidisciplinary teams.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h3 className="mb-1 text-sm font-semibold text-white">Manizales</h3>
              <p className="text-sm text-zinc-300">
                A calm, mountainous city in the coffee region. Ideal for recovery and follow‑up care, with institutional
                partners and a slower pace that supports rest.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            What &ldquo;trusted network&rdquo; means
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• A limited number of clinics and specialists we know and actively work with.</li>
              <li>• Clear points of contact and institutional backing—not anonymous listings.</li>
              <li>• Alignment around quality, transparency, and experience for international patients.</li>
              <li>• The ability to pause or stop collaboration if standards are not met.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Over time, more partners may be added, but always through a curation process. The goal is depth and
              reliability, not a directory of everyone.
            </p>
          </div>
        </section>

        <section className="mb-4 border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <p>
            You can always start with a{" "}
            <Link href="/assessment" className="text-emerald-400 hover:text-emerald-300">
              free smile assessment
            </Link>{" "}
            to understand which clinic, city, and package are the best fit for you.
          </p>
        </section>
      </main>
    </div>
  );
}

