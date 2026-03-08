type Props = Readonly<{
  city: string | null;
  recommendedDates: string | null;
  airportTransfer: string | null;
  hotelSuggestion: string | null;
}>;

const FALLBACK_CITY = "Colombia (Medellín / Manizales)";
const FALLBACK_DATES = "To be confirmed after deposit";
const FALLBACK_TRANSFER = "Included in package — details after booking";
const FALLBACK_ACCOMMODATION = "Included in package — details after booking";

export default function TravelPlanSection({
  city,
  recommendedDates,
  airportTransfer,
  hotelSuggestion,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Travel plan</h3>
      <p className="mt-1 text-sm text-zinc-600">Flights, transfer, and accommodation</p>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Destination</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{city?.trim() || FALLBACK_CITY}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Travel dates</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{recommendedDates?.trim() || FALLBACK_DATES}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Airport transfer</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{airportTransfer?.trim() || FALLBACK_TRANSFER}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Accommodation</dt>
          <dd className="mt-0.5 font-medium text-zinc-900">{hotelSuggestion?.trim() || FALLBACK_ACCOMMODATION}</dd>
        </div>
      </dl>
    </section>
  );
}
