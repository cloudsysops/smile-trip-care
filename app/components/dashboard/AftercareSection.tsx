type Props = Readonly<{
  instructions: string | null;
}>;

const DEFAULT_AFTERCARE_INTRO =
  "Your coordinator will share personalized instructions after your procedure. In the meantime, follow these general guidelines:";

const DEFAULT_AFTERCARE_BULLETS = `• Rest as recommended by your specialist
• Avoid hard or sticky foods for the first few days
• Keep the treatment area clean; follow any rinse instructions
• Take prescribed medication as directed
• Attend your follow-up appointment
• Contact your care coordinator if you have any concerns`;

export default function AftercareSection({ instructions }: Props) {
  const customTrimmed = instructions?.trim();
  const content = customTrimmed
    ? customTrimmed
    : `${DEFAULT_AFTERCARE_INTRO}\n\n${DEFAULT_AFTERCARE_BULLETS}`;
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Aftercare</h3>
      <p className="mt-1 text-sm text-zinc-600">Recovery and follow-up guidance</p>
      <div className="mt-4 whitespace-pre-line rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700">
        {content}
      </div>
    </section>
  );
}
