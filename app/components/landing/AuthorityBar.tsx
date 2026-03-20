"use client";

/**
 * Horizontal marquee of clinic and accreditation logos for visual authority.
 * Use grayscale for a premium, editorial look. Replace placeholder items with real logos when available.
 */
const TRUST_ITEMS = [
  { label: "International Patient Coordination", id: "ipc" },
  { label: "Verified Clinic Network", id: "vcn" },
  { label: "Concierge Support", id: "concierge" },
  { label: "Secure Deposit Payments", id: "secure" },
  { label: "Medellín & Manizales Care Journeys", id: "care-journeys" },
];

function LogoItem({ label }: Readonly<{ label: string }>) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-white/5 px-6 py-3 grayscale transition hover:grayscale-0"
      title={label}
    >
      <span className="text-sm font-semibold tracking-wide text-zinc-400">{label}</span>
    </div>
  );
}

export default function AuthorityBar() {
  const duplicated = [...TRUST_ITEMS, ...TRUST_ITEMS];
  return (
    <section aria-label="Trust and accreditation" className="overflow-hidden border-y border-zinc-800/80 bg-zinc-950/50 py-6">
      <div className="flex animate-marquee gap-8 whitespace-nowrap">
        {duplicated.map((item, i) => (
          <LogoItem key={`${item.id}-${i}`} label={item.label} />
        ))}
      </div>
    </section>
  );
}
