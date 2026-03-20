import Link from "next/link";
import Image from "next/image";
import { WhatsAppButton } from "@/app/components/WhatsAppButton";

type Props = {
  name: string;
  specialty: string;
  city: string;
  clinicOrInstitution: string | null;
  /** Optional image URL; placeholder shown when null */
  imageUrl?: string | null;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SpecialistHero({ name, specialty, city, clinicOrInstitution, imageUrl }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">{specialty}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{name}</h1>
          <p className="mt-2 text-zinc-400">
            {city}
            {clinicOrInstitution ? ` · ${clinicOrInstitution}` : ""}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/assessment"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Start Free Evaluation
            </Link>
            <WhatsAppButton
              label="Request Consultation"
              variant="inline"
              className="min-h-[48px] inline-flex items-center justify-center rounded-full border-2 border-zinc-600 px-6 py-3 text-base font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            />
          </div>
        </div>
        <div className="aspect-[4/3] md:aspect-square bg-zinc-800 relative flex items-center justify-center">
          {imageUrl ? (
            <>
              <Image src={imageUrl} alt="" className="object-cover" fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
            </>
          ) : (
            <span
              className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600/90 text-3xl font-bold text-white"
              aria-hidden
            >
              {getInitials(name)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
