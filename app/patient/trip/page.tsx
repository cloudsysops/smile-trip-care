import { redirect } from "next/navigation";
import { requirePatient } from "@/lib/auth";
import { getPatientDashboardData } from "@/lib/dashboard-data";
import { getTripAnchorDateForLead, listItineraryItemsForLead } from "@/lib/patient-itinerary";
import PatientTripBuilder from "./PatientTripBuilder";

type Search = Promise<{ addService?: string }>;

export default async function PatientTripPage({ searchParams }: Readonly<{ searchParams: Search }>) {
  let profile;
  try {
    const ctx = await requirePatient();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/patient/trip");
  }

  const sp = await searchParams;
  const email = profile.email ?? "";
  const data = await getPatientDashboardData(email);
  const leads = data.leads as { id: string }[];
  const lead = leads[0];
  if (!lead) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-300">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h1 className="text-lg font-semibold text-white">No trip yet</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Complete an assessment so we can link services to your journey.
          </p>
          <a href="/assessment" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:underline">
            Go to assessment →
          </a>
        </div>
      </div>
    );
  }

  const [items, anchor] = await Promise.all([
    listItineraryItemsForLead(lead.id),
    getTripAnchorDateForLead(lead.id),
  ]);

  return (
    <PatientTripBuilder
      leadId={lead.id}
      anchorDate={anchor}
      initialItems={items}
      presetServiceId={sp.addService?.trim() || undefined}
    />
  );
}
