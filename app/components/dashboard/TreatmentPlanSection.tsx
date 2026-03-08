type Props = Readonly<{
  procedureType: string;
  estimatedDuration: string | null;
  clinic: string | null;
  doctor: string | null;
}>;

const FALLBACK_PROCEDURE = "Your recommended package";
const FALLBACK_DURATION = "Confirmed with your coordinator";
const FALLBACK_CLINIC = "Partner clinic in your destination";
const FALLBACK_DOCTOR = "Assigned specialist for your package";

export default function TreatmentPlanSection({
  procedureType,
  estimatedDuration,
  clinic,
  doctor,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Treatment plan</h3>
      <p className="mt-1 text-sm text-zinc-600">Recommended treatment and care details</p>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Procedure / package</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{procedureType?.trim() || FALLBACK_PROCEDURE}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Estimated duration</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{estimatedDuration?.trim() || FALLBACK_DURATION}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Clinic</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{clinic?.trim() || FALLBACK_CLINIC}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Specialist</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{doctor?.trim() || FALLBACK_DOCTOR}</dd>
        </div>
      </dl>
    </section>
  );
}
