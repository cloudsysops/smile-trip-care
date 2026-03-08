import Link from "next/link";
import { branding } from "@/lib/branding";
import { getPublishedPackages } from "@/lib/packages";
import { getPublishedAssets } from "@/lib/assets";
import { getPublishedSpecialists } from "@/lib/specialists";
import { getPublishedExperiences } from "@/lib/experiences";
import { WhatsAppButton } from "./components/WhatsAppButton";
import PackageCard from "./components/landing/package-card";
import SpecialistCard from "./components/landing/specialist-card";
import ExperienceCard from "./components/landing/experience-card";
import PartnerInstitutionCard from "./components/landing/partner-institution-card";
import ImagePlaceholder from "./components/landing/image-placeholder";
import type { PublicAsset } from "@/lib/assets";

function getPackageImage(assets: PublicAsset[], location: string): PublicAsset | null {
  const match = assets.find((a) => a.location === location && a.url);
  return match ?? assets.find((a) => a.url) ?? null;
}

const WHY_COLOMBIA = [
  { title: "Up to 60–70% cost savings", desc: "World-class care at a fraction of US and European prices." },
  { title: "Experienced specialists", desc: "Board-certified and internationally trained professionals." },
  { title: "Modern clinics", desc: "State-of-the-art facilities and equipment." },
  { title: "Beautiful recovery destinations", desc: "Medellín and Manizales offer safe, welcoming environments." },
];

const TESTIMONIALS = [
  { quote: "I saved over $8,000 compared to US prices. The clinic was modern and the team made everything easy.", author: "Sarah M.", role: "Dental implants, USA", stars: 5 },
  { quote: "Amazing care and beautiful recovery experience. From the first message to arrival, everything was coordinated.", author: "Patient", role: "Medellín package", stars: 5 },
  { quote: "The specialists were excellent and the recovery in Manizales was perfect. I recommend Nebula Smile to anyone considering dental travel.", author: "James K.", role: "Smile design", stars: 5 },
];

/** Trusted partners / institutions (verified public info only; images are placeholders until approved assets). */
const TRUSTED_PARTNERS = [
  {
    name: "Instituto INMEDENT S.A.S.",
    city: "Manizales",
    tagline: "Oral health & dental care",
    description: "Institutional presence and trust in Manizales. Professional, quality-oriented care with physical facilities and a clear focus on patient experience. Part of our trusted network for treatment and recovery in the coffee region.",
    imageUrl: null as string | null,
    websiteUrl: null as string | null,
  },
];

/** Placeholder cards for Trusted Clinical Network (institutions, specialists, partner clinics). Replace with real data when available. */
const TRUSTED_CLINICAL_NETWORK_CARDS = [
  { type: "institution" as const, name: "Clinical institution", city: "Manizales", specialty: "Oral health & dental", description: "Curated clinical institution in our network. Professional facilities and patient-centered care. Approved partner media can be added here.", image: null as string | null, website: null as string | null },
  { type: "specialist" as const, name: "Specialist practice", city: "Medellín", specialty: "Dental & oral surgery", description: "Trusted specialist within our referral network. Quality over quantity—we work with vetted professionals only.", image: null as string | null, website: null as string | null },
  { type: "clinic" as const, name: "Partner clinic", city: "Manizales", specialty: "Recovery & follow-up care", description: "Partner clinic for recovery and follow-up in the coffee region. Calm environment and coordinated care.", image: null as string | null, website: null as string | null },
];

/** Patient journey steps for Medical Experience Story. */
const MEDICAL_EXPERIENCE_JOURNEY = [
  { step: 1, title: "Free evaluation", body: "Share your details and goals. Our team and specialists review your case at no cost and recommend a personalized plan." },
  { step: 2, title: "Treatment recommendation", body: "Receive your treatment plan, package options, and next steps—no obligation." },
  { step: 3, title: "Travel coordination", body: "We coordinate lodging, transport between Medellín and Manizales, and your program so you focus on your care." },
  { step: 4, title: "Treatment in Medellín or Manizales", body: "Treatment in modern clinics with experienced specialists. Both cities are valid paths depending on your plan." },
  { step: 5, title: "Recovery experience", body: "Recover in a calm, supported environment. Optional experiences: coffee tours, wellness, nature." },
  { step: 6, title: "Optional tours", body: "Customize your stay with cultural activities, hot springs, or city tours—all optional." },
];

function TrustIcon({ icon }: { icon: string }) {
  const c = "h-6 w-6 text-emerald-500";
  if (icon === "people") {
    return (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    );
  }
  if (icon === "clinic") {
    return (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  if (icon === "transport") {
    return (
      <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    );
  }
  return (
    <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-hidden>
      {Array.from({ length: stars }).map((_, i) => (
        <span key={i} className="text-lg">★</span>
      ))}
    </div>
  );
}

export default async function Home() {
  const [packages, allAssets, specialists, experiences] = await Promise.all([
    getPublishedPackages(),
    getPublishedAssets({ limit: 24 }),
    getPublishedSpecialists(),
    getPublishedExperiences(),
  ]);
  const prioritized = [...allAssets].sort((a, b) => {
    const score = (x: { category: string | null }) => (x.category === "clinic" || x.category === "team" ? 1 : 0);
    return score(b) - score(a);
  });
  const heroImage = prioritized[0]?.url ? prioritized[0] : allAssets.find((a) => a.url) ?? null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Announcement bar */}
      <div className="bg-emerald-950/90 border-b border-emerald-800/50 text-center py-2 px-4">
        <p className="text-sm text-emerald-100">
          Free Smile Evaluation — no commitment. We respond within 24 hours.{" "}
          <Link href="/assessment" className="font-semibold text-white underline underline-offset-2 hover:text-emerald-200">
            Start free
          </Link>
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:py-5">
          <Link href="/" className="text-lg font-semibold text-white hover:text-zinc-200">{branding.productName}</Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-zinc-400 hover:text-white sm:inline-block">
              Sign in
            </Link>
            <Link
              href="/assessment"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 sm:px-5 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Start Free Assessment
            </Link>
            <Link
              href="/packages"
              className="hidden rounded-full border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/80 sm:inline-block focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              View Treatment Packages
            </Link>
            <Link href="/#how-it-works" className="hidden text-sm font-medium text-zinc-400 hover:text-white sm:inline-block">
              How it works
            </Link>
            <Link href="/#specialists" className="hidden text-sm font-medium text-zinc-400 hover:text-white sm:inline-block">
              Specialists
            </Link>
            <Link href="/#trusted-clinical-network" className="hidden text-sm font-medium text-zinc-400 hover:text-white sm:inline-block">
              Clinical network
            </Link>
            <Link href="/#trusted-partners" className="hidden text-sm font-medium text-zinc-400 hover:text-white sm:inline-block">
              Partners
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12 md:py-16">
        {/* 1. Hero — Silicon Valley style */}
        <section id="hero" className="mb-20 scroll-mt-6 md:mb-28">
          <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-12">
            <div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                Transform Your Smile in Colombia<br />
                <span className="text-emerald-400">Save up to 70%</span> on world-class dental treatments.
              </h1>
              <p className="mb-8 max-w-lg text-lg text-zinc-400">
                {branding.productName} connects international patients with verified clinics in Medellín and Manizales.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link
                  href="/assessment"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100 sm:w-auto focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Start My Free Smile Assessment
                </Link>
                <Link
                  href="/packages"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-zinc-600 px-8 py-4 text-base font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 sm:w-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  View Treatment Packages
                </Link>
              </div>
              <p className="mt-3 text-sm text-zinc-500" aria-hidden="true">
                No commitment · Response within 24 hours
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 md:aspect-square">
              {heroImage?.url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImage.url}
                    alt={heroImage.alt_text ?? heroImage.title ?? `${branding.productName} — Medellín and Manizales`}
                    className="h-full w-full object-cover"
                    fetchPriority="high"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
                </>
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500">
                  <span className="text-sm font-medium">Medellín & Manizales</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. Trust — pillars + badges */}
        <section id="trust" className="mb-20 scroll-mt-6 md:mb-28">
          <div className="mb-10 flex flex-wrap items-center justify-center gap-6 border-y border-zinc-800 py-8">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              </span>
              Verified clinic
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              International standards
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              Secure payments
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </span>
              Concierge support
            </span>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center transition hover:border-emerald-500/50">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20"><TrustIcon icon="clinic" /></div>
              <h3 className="mb-1 font-bold text-white">Verified Clinics</h3>
              <p className="text-sm text-zinc-400">Vetted partners in Medellín and Manizales. Quality and safety first.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center transition hover:border-emerald-500/50">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20"><TrustIcon icon="people" /></div>
              <h3 className="mb-1 font-bold text-white">International Patients</h3>
              <p className="text-sm text-zinc-400">Thousands of patients from the US, Canada, and Europe choose Colombia.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center transition hover:border-emerald-500/50">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20"><TrustIcon icon="transport" /></div>
              <h3 className="mb-1 font-bold text-white">Concierge Medical Travel</h3>
              <p className="text-sm text-zinc-400">We handle lodging, transport, and appointments so you focus on your smile.</p>
            </li>
          </ul>
          <p className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-400">
            <strong className="text-zinc-300">Legal:</strong> We coordinate travel and hospitality. Medical services are provided by licensed clinics and specialists in Colombia.
          </p>
        </section>

        {/* Verified Clinics */}
        <section id="verified-clinics" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Verified clinics
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Partner clinics we work with in Medellín and Manizales
          </p>
          <ul className="grid gap-6 sm:grid-cols-2">
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified Clinic
              </span>
              <h3 className="mt-4 font-bold text-white">Instituto Inmedent</h3>
              <p className="mt-1 text-sm font-medium text-zinc-400">Manizales</p>
              <p className="mt-2 text-sm text-zinc-400">Oral health and dental care in the coffee region. Part of our trusted network for treatment and recovery.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified Clinic
              </span>
              <h3 className="mt-4 font-bold text-white">Clínica San Martín</h3>
              <p className="mt-1 text-sm font-medium text-zinc-400">Medellín</p>
              <p className="mt-2 text-sm text-zinc-400">Trust anchor in Medellín. Modern facilities and experienced specialists for your smile journey.</p>
            </li>
          </ul>
        </section>

        {/* Treatments — main offerings */}
        <section id="treatments" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Treatments
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            World-class dental care in Colombia
          </p>
          <ul className="grid gap-6 sm:grid-cols-3">
            {[
              { title: "Dental Implants", slug: "essential-care-journey", desc: "Permanent solutions with verified specialists and significant savings." },
              { title: "Hollywood Smile", slug: "comfort-recovery-journey", desc: "Complete smile makeovers with veneers and aesthetic design." },
              { title: "Smile Design", slug: "premium-transformation-experience", desc: "Personalized treatment plans for your ideal smile." },
            ].map(({ title, slug, desc }) => (
              <li key={slug}>
                <Link
                  href={`/packages/${slug}`}
                  className="block rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 transition hover:border-emerald-500/50 hover:bg-zinc-900"
                >
                  <h3 className="mb-2 font-bold text-white">{title}</h3>
                  <p className="text-sm text-zinc-400">{desc}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-emerald-400">View package →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Trusted Clinical Network */}
        <section id="trusted-clinical-network" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Trusted Clinical Network
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Curated partners and institutions in Medellín and Manizales
          </p>
          <p className="mb-10 max-w-2xl text-zinc-400">
            {branding.productName} works with a curated network of clinical institutions, specialists, and partner clinics—not an open marketplace. Every partner is vetted for quality, professionalism, and patient experience.
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRUSTED_CLINICAL_NETWORK_CARDS.map((card, idx) => (
              <li key={idx}>
                <PartnerInstitutionCard
                  name={card.name}
                  city={card.city}
                  description={card.description}
                  image={card.image}
                  website={card.website}
                  specialty={card.specialty}
                />
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-500">
            Placeholder cards. Real institution data and approved images (e.g. clinic, specialist, facility) can be wired in when available.
          </p>
        </section>

        {/* Trust signals */}
        <section id="trust-signals" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Why we&apos;re different
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Curated specialists, trusted partners, private network
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Curated specialists</h3>
              <p className="text-sm text-zinc-400">We work with vetted professionals by referral—no open directory. Quality and fit matter more than volume.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Trusted partners</h3>
              <p className="text-sm text-zinc-400">Clinical institutions and partner clinics are selected for standards, facilities, and patient experience.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Private referral network</h3>
              <p className="text-sm text-zinc-400">Our network is invitation-based. Patients get a coordinated path, not a list of options.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Quality over quantity</h3>
              <p className="text-sm text-zinc-400">We focus on the right match and full journey—evaluation, treatment, recovery, and optional experiences.</p>
            </li>
          </ul>
        </section>

        {/* 3. Free Medical Evaluation */}
        <section id="evaluation" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Free medical evaluation
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Get a free case review before you travel
          </p>
          <ul className="mb-8 grid gap-4 sm:grid-cols-3">
            <li className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">1</span>
              <div>
                <h3 className="font-semibold text-white">Submit your assessment</h3>
                <p className="mt-1 text-sm text-zinc-400">Share your details and goals. Optional: upload photos for a more accurate review.</p>
              </div>
            </li>
            <li className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">2</span>
              <div>
                <h3 className="font-semibold text-white">We review your case</h3>
                <p className="mt-1 text-sm text-zinc-400">Our team and specialists evaluate and prepare a personalized recommendation.</p>
              </div>
            </li>
            <li className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">3</span>
              <div>
                <h3 className="font-semibold text-white">Receive treatment plan</h3>
                <p className="mt-1 text-sm text-zinc-400">Get your plan, package options, and next steps—no obligation.</p>
              </div>
            </li>
          </ul>
          <Link
            href="/assessment"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Start Free Assessment
          </Link>
        </section>

        {/* How it works — 3 steps */}
        <section id="how-it-works" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            How it works
          </h2>
          <p className="mb-10 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Three steps to your new smile
          </p>
          <ul className="grid gap-6 sm:grid-cols-3">
            <li className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center shadow-lg shadow-black/20">
              <span className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">1</span>
              <h3 className="font-semibold text-white">Share your smile</h3>
              <p className="text-sm text-zinc-400">Complete our free assessment and share your goals. Optional photos help us personalize your plan.</p>
            </li>
            <li className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center shadow-lg shadow-black/20">
              <span className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">2</span>
              <h3 className="font-semibold text-white">Get matched with a specialist</h3>
              <p className="text-sm text-zinc-400">Our team connects you with a vetted specialist and clinic in Medellín or Manizales.</p>
            </li>
            <li className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center shadow-lg shadow-black/20">
              <span className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xl font-bold text-white">3</span>
              <h3 className="font-semibold text-white">Travel and transform your smile</h3>
              <p className="text-sm text-zinc-400">We coordinate travel, lodging, and appointments. You focus on your care and recovery.</p>
            </li>
          </ul>
          <div className="mt-8 text-center">
            <Link
              href="/assessment"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-zinc-900 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Start My Free Smile Assessment
            </Link>
          </div>
        </section>

        {/* Medical Experience Story — full patient journey */}
        <section id="medical-experience-story" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Your medical experience
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            From free evaluation to recovery—one coordinated journey
          </p>
          <ol className="space-y-6">
            {MEDICAL_EXPERIENCE_JOURNEY.map(({ step, title, body }) => (
              <li key={step} className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">{step}</span>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 5. Travel Packages */}
        <section id="packages" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Travel packages
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Two-city journey: treatment in Medellín, recovery in Manizales
          </p>
          {packages.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-12 text-center">
              <p className="text-zinc-500">No packages available at the moment. Check back soon.</p>
              <Link href="/packages" className="mt-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">View packages page →</Link>
            </div>
          ) : (
            <>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg, idx) => {
                  const img = getPackageImage(allAssets, pkg.location);
                  const recommended = pkg.badge === "MOST POPULAR" || (idx === 0 && !packages.some((p) => p.badge === "MOST POPULAR"));
                  return (
                    <PackageCard key={pkg.id} pkg={pkg} image={img} recommended={!!recommended} />
                  );
                })}
              </ul>
              <div className="mt-8 text-center">
                <Link
                  href="/packages"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-zinc-600 px-8 py-4 text-base font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  View all packages
                </Link>
              </div>
            </>
          )}
        </section>

        {/* 6. Meet Our Specialists */}
        {specialists.length > 0 && (
          <section id="specialists" className="mb-20 scroll-mt-6 md:mb-28">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Meet Our Specialists
            </h2>
            <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
              Free evaluation included in your visit
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {specialists.map((s) => (
                <SpecialistCard key={s.id} specialist={s} imageUrl={null} />
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/assessment"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Request specialist consultations
              </Link>
            </div>
          </section>
        )}

        {/* 7. Recovery Experiences */}
        {experiences.length > 0 && (
          <section id="experiences" className="mb-20 scroll-mt-6 md:mb-28">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Customize your recovery experience
            </h2>
            <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
              Coffee tours, hot springs, paragliding, city tours, spa treatments, and more
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {experiences.map((ex) => (
                <ExperienceCard key={ex.id} experience={ex} />
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/assessment"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Select experiences in your assessment
              </Link>
            </div>
          </section>
        )}

        {/* 8. Why Medellín + Manizales */}
        <section id="why-medellin-manizales" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Why Medellín + Manizales
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Two cities, one coordinated journey: treatment then recovery
          </p>
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Medellín — treatment hub</h3>
              <p className="text-sm text-zinc-400">Modern clinics, experienced specialists, and your first consultations. We coordinate lodging and in-city transport so you focus on your care.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Manizales — recovery in the coffee region</h3>
              <p className="text-sm text-zinc-400">Recover in a calm, welcoming environment. Optional experiences: coffee tours, hot springs, nature. Family-run hospitality and support.</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400">
            Both Medellín and Manizales are valid paths for oral health and medical tourism: treatment in modern clinics, then recovery in a safe, welcoming city with institutional partners you can trust.
          </p>
          {/* TODO: Approved media — treatment room, doctor consultation, Medellín skyline. Add URLs when available. */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ImagePlaceholder label="Treatment room / clinic" aspectRatio="4/3" />
            <ImagePlaceholder label="Doctor consultation" aspectRatio="4/3" />
            <ImagePlaceholder label="Medellín skyline" aspectRatio="4/3" />
          </div>
        </section>

        {/* Trusted Network in Manizales */}
        <section id="trusted-network-manizales" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Trusted network in Manizales
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Vetted institutions and clinics in the coffee region
          </p>
          <p className="mb-10 max-w-2xl text-zinc-400">
            We work with a curated network of partners in Manizales: established institutions with physical facilities, professional standards, and a focus on quality and patient experience. Contact and city references are part of how we select and maintain our trusted network.
          </p>
          <Link
            href="/#trusted-partners"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-zinc-600 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Meet our trusted partners
          </Link>
        </section>

        {/* Recover in the calm of Manizales */}
        <section id="recovery-manizales" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Recover in the calm of Manizales
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Calm environment, mountains and nature, smaller-city pace
          </p>
          <p className="mb-10 max-w-2xl text-zinc-400">
            Manizales is ideal for recovery: a calmer pace, mountains and nature, and professional institutions focused on patient comfort. Our partners there offer a supportive environment so you can heal in a welcoming, local context.
          </p>
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* TODO: Replace with approved media — clinic environment, treatment rooms, patient care, Manizales landscapes. See image-placeholder.tsx. */}
            <ImagePlaceholder label="Manizales mountains / nature" aspectRatio="4/3" />
            <ImagePlaceholder label="Clinic environment" aspectRatio="4/3" />
            <ImagePlaceholder label="Patient care" aspectRatio="4/3" />
            <ImagePlaceholder label="Nature / recovery setting" aspectRatio="4/3" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Calm environment</h3>
              <p className="text-sm text-zinc-400">Smaller-city pace and a focus on rest. Manizales offers a safe, welcoming setting for recovery.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Professional institutions</h3>
              <p className="text-sm text-zinc-400">Trusted clinics and facilities with clear standards. You know where you are and who is caring for you.</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-bold text-white">Patient comfort</h3>
              <p className="text-sm text-zinc-400">Quality-oriented care and a focus on patient experience. Our partners are selected for outcomes and comfort.</p>
            </div>
          </div>
        </section>

        {/* Trusted Partners / Institutions (partner cards) */}
        <section id="trusted-partners" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Our trusted partners
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Institutions and clinics we work with
          </p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TRUSTED_PARTNERS.map((partner, idx) => (
              <li key={idx}>
                <PartnerInstitutionCard
                  name={partner.name}
                  city={partner.city}
                  description={partner.description}
                  image={partner.imageUrl}
                  website={partner.websiteUrl}
                  specialty={partner.tagline}
                />
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-4 text-sm text-zinc-500">
            Partner images are placeholders. Approved assets (e.g. from Instagram, Facebook, or manual upload) can be added to the platform and will appear here when configured.
          </p>
        </section>

        <section id="why-colombia" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Why Colombia
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            World-class care in a welcoming destination
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_COLOMBIA.map(({ title, desc }) => (
              <li key={title} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 transition hover:border-zinc-700">
                <h3 className="mb-2 font-bold text-white">{title}</h3>
                <p className="text-sm text-zinc-400">{desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Before / After gallery */}
        <section id="before-after" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Smile transformations
          </h2>
          <p className="mb-8 max-w-2xl text-2xl font-bold text-white md:text-3xl">
            Real results from our partner clinics
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              <div className="aspect-[3/4] bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-medium uppercase tracking-wider">Before</div>
              <p className="p-3 text-center text-sm text-zinc-400">Before</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              <div className="aspect-[3/4] bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-medium uppercase tracking-wider">After</div>
              <p className="p-3 text-center text-sm text-zinc-400">After</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              <div className="aspect-[3/4] bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-medium uppercase tracking-wider">Before</div>
              <p className="p-3 text-center text-sm text-zinc-400">Before</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              <div className="aspect-[3/4] bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-medium uppercase tracking-wider">After</div>
              <p className="p-3 text-center text-sm text-zinc-400">After</p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Results may vary. Approved before/after images can be added when available.
          </p>
        </section>

        {/* 9. Testimonials — photo + quote */}
        <section id="testimonials" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Testimonials
          </h2>
          <p className="mb-8 text-2xl font-bold text-white md:text-3xl">
            What our patients say
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <blockquote key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-lg font-semibold">
                    {(t.author ?? "?").charAt(0)}
                  </div>
                  <div>
                    <StarRating stars={t.stars} />
                    <cite className="mt-1 block not-italic font-semibold text-white">{t.author}</cite>
                    {"role" in t && t.role && <span className="text-xs text-zinc-500">{t.role}</span>}
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-zinc-300">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </blockquote>
            ))}
          </div>
        </section>

        {/* 10. FAQ */}
        <section id="faq" className="mb-20 scroll-mt-6 md:mb-28">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            FAQ
          </h2>
          <p className="mb-8 text-2xl font-bold text-white md:text-3xl">
            Free evaluation, packages, and what to expect
          </p>
          <ul className="space-y-4">
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-semibold text-white">Is the evaluation really free?</h3>
              <p className="text-sm text-zinc-400">Yes. You submit your details and goals; our team and specialists review your case at no cost. You receive a personalized treatment plan and package options with no obligation.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-semibold text-white">What does my package include?</h3>
              <p className="text-sm text-zinc-400">Each package description lists what is included (e.g. consultations, procedures, lodging, transport between Medellín and Manizales, recovery support). Check the package details and &ldquo;includes&rdquo; list for your chosen option.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-semibold text-white">Are flights included?</h3>
              <p className="text-sm text-zinc-400">International flights are not included. We coordinate lodging, in-country transport, and your program once you arrive. We can advise on travel and timing.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-semibold text-white">How does the deposit work?</h3>
              <p className="text-sm text-zinc-400">After you choose a package, a deposit secures your spot. The amount is shown on each package. The remainder is typically due according to the clinic&apos;s terms. We&apos;ll guide you through the process.</p>
            </li>
            <li className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h3 className="mb-2 font-semibold text-white">Medical disclaimer</h3>
              <p className="text-sm text-zinc-400">We coordinate travel and hospitality. Medical advice, diagnosis, and treatment are provided by licensed clinics and specialists in Colombia. Always discuss your specific case with your provider.</p>
            </li>
          </ul>
        </section>

        {/* 11. Final CTA */}
        <section id="cta" className="mb-20 scroll-mt-6 md:mb-28" aria-labelledby="final-cta-title">
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-zinc-900/80 p-8 text-center md:p-14">
            <h2 id="final-cta-title" className="mb-3 text-2xl font-bold text-white md:text-4xl">
              Get Your Personalized Smile Plan
            </h2>
            <p className="mx-auto mb-8 max-w-md text-zinc-400">
              Free assessment. Personalized plan from verified clinics. No commitment.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/assessment"
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-white px-10 py-4 text-lg font-semibold text-zinc-900 hover:bg-zinc-100 sm:w-auto focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Start My Free Assessment
              </Link>
              <WhatsAppButton
                label="Chat on WhatsApp"
                variant="inline"
                className="w-full justify-center rounded-full border-0 bg-emerald-600 px-10 py-4 text-lg font-semibold hover:bg-emerald-700 sm:w-auto min-h-[52px]"
              />
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-800 pt-12">
          <div className="grid gap-8 sm:grid-cols-3 md:grid-cols-4">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Packages</h3>
              <Link href="/#packages" className="block text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded">
                Explore packages
              </Link>
              <Link href="/#trusted-partners" className="mt-1 block text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded">
                Trusted partners
              </Link>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Start</h3>
              <Link href="/assessment" className="block text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded">
                Free evaluation
              </Link>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</h3>
              <WhatsAppButton label="Chat on WhatsApp" variant="inline" className="inline-flex text-sm" />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Legal</h3>
              <Link href="/legal" className="block text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded">
                Privacy &amp; legal
              </Link>
            </div>
          </div>
          <p className="mt-10 text-center text-sm text-zinc-500">
            {branding.productName} — A {branding.companyName} company.<br className="sm:hidden" /> International coordination &amp; hospitality. Medical services billed by clinics in Colombia.
          </p>
        </footer>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/98 backdrop-blur py-3 px-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
            <p className="text-sm font-medium text-zinc-300">
              Ready? Get your free evaluation — we respond within 24 hours.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/assessment"
                className="min-h-[44px] inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Start Free Smile Assessment
              </Link>
              <WhatsAppButton label="Chat" variant="inline" className="min-h-[44px] inline-flex items-center justify-center rounded-full border border-zinc-600 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950" />
            </div>
          </div>
        </div>
        <div className="h-20" aria-hidden />
      </main>
    </div>
  );
}
