import { WhatsAppButton } from "@/app/components/WhatsAppButton";

type Props = Readonly<{
  coordinatorName: string | null;
}>;

const COORDINATOR_PLACEHOLDER =
  "Your care coordinator will be assigned once your deposit is confirmed. They’ll help with travel, clinic coordination, and any questions before, during, and after your trip.";

export default function CareCoordinatorSection({ coordinatorName }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Care coordinator</h3>
      <p className="mt-1 text-sm text-zinc-600">Your dedicated point of contact</p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Assigned coordinator</p>
          <p className="mt-0.5 font-medium text-zinc-900">
            {coordinatorName?.trim() || "To be assigned after deposit confirmation"}
          </p>
          {!coordinatorName?.trim() && (
            <p className="mt-2 text-sm text-zinc-500">{COORDINATOR_PLACEHOLDER}</p>
          )}
        </div>
        <div className="shrink-0">
          <WhatsAppButton
            message="Hi, I have a question about my Nebula Smile journey."
            label="Contact via WhatsApp"
            variant="inline"
            className="inline-flex justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          />
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
        <p className="text-sm text-zinc-500">Prefer chat? Reach your coordinator on WhatsApp anytime.</p>
      </div>
    </section>
  );
}
