/**
 * Role-scoped server-side data for dashboards. Each helper returns only what that role is allowed to see.
 */
import { getServerSupabase } from "@/lib/supabase/server";

export type ProviderOverviewMetrics = {
  packages_count: number;
  specialists_count: number;
  bookings_count: number;
  revenue_cents: number;
};

/** Aggregates for provider self-service overview (API + dashboard). */
export async function getProviderOverviewMetrics(providerId: string): Promise<ProviderOverviewMetrics> {
  const supabase = getServerSupabase();
  const [pkgRes, specRes, bookRes] = await Promise.all([
    supabase.from("packages").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
    supabase.from("specialists").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("provider_id", providerId),
  ]);
  const packages_count = pkgRes.count ?? 0;
  const specialists_count = specRes.count ?? 0;
  const bookings_count = bookRes.count ?? 0;

  const { data: bookingRows } = await supabase.from("bookings").select("lead_id").eq("provider_id", providerId);
  const leadIds = [...new Set((bookingRows ?? []).map((r) => r.lead_id as string).filter(Boolean))];
  let revenue_cents = 0;
  if (leadIds.length > 0) {
    const { data: payRows } = await supabase
      .from("payments")
      .select("amount_cents")
      .in("lead_id", leadIds)
      .eq("status", "succeeded");
    for (const row of payRows ?? []) {
      const cents = row.amount_cents;
      if (typeof cents === "number" && Number.isFinite(cents)) revenue_cents += cents;
    }
  }
  return { packages_count, specialists_count, bookings_count, revenue_cents };
}

/** Provider dashboard: own provider, packages, specialists, experiences, bookings summary */
export async function getProviderDashboardData(providerId: string) {
  const supabase = getServerSupabase();
  const [providerRes, packagesRes, specialistsRes, experiencesRes, bookingsRes] = await Promise.all([
    supabase.from("providers").select("id, name, city, approval_status, published").eq("id", providerId).single(),
    supabase.from("packages").select("id, slug, name, published").eq("provider_id", providerId).order("slug"),
    supabase.from("specialists").select("id, name, specialty, approval_status, published").eq("provider_id", providerId).order("name"),
    supabase.from("experiences").select("id, name, city, published").eq("provider_id", providerId).order("name"),
    supabase.from("bookings").select("id, status, lead_id, package_id").eq("provider_id", providerId).order("created_at", { ascending: false }).limit(20),
  ]);
  return {
    provider: providerRes.data ?? null,
    packages: packagesRes.data ?? [],
    specialists: specialistsRes.data ?? [],
    experiences: experiencesRes.data ?? [],
    bookings: bookingsRes.data ?? [],
  };
}

export type SpecialistConsultationListRow = {
  id: string;
  lead_id: string;
  status: string;
  requested_at: string | null;
  scheduled_at: string | null;
  case_priority: string;
  patient_name: string;
};

/** Specialist dashboard: own profile, consultation requests, related items */
export async function getSpecialistDashboardData(specialistId: string) {
  const supabase = getServerSupabase();
  const [specialistRes, consultationsRes] = await Promise.all([
    supabase.from("specialists").select("id, name, specialty, city, approval_status, published").eq("id", specialistId).single(),
    supabase
      .from("consultations")
      .select(
        "id, lead_id, status, requested_at, scheduled_at, case_priority, leads!inner(first_name, last_name)",
      )
      .eq("specialist_id", specialistId)
      .order("requested_at", { ascending: false, nullsFirst: false })
      .limit(100),
  ]);

  type RawRow = {
    id: string;
    lead_id: string;
    status: string;
    requested_at: string | null;
    scheduled_at: string | null;
    case_priority?: string | null;
    leads?: { first_name?: string | null; last_name?: string | null } | null;
  };
  const raw = (consultationsRes.data ?? []) as RawRow[];
  const consultations: SpecialistConsultationListRow[] = raw.map((row) => {
    const first = row.leads?.first_name ?? "";
    const last = row.leads?.last_name ?? "";
    const patient_name = `${first} ${last}`.trim() || "Patient";
    return {
      id: row.id,
      lead_id: row.lead_id,
      status: row.status,
      requested_at: row.requested_at,
      scheduled_at: row.scheduled_at,
      case_priority: row.case_priority ?? "normal",
      patient_name,
    };
  });

  if (process.env.NODE_ENV === "development") {
    // Trace specialist dashboard data (remove or gate if noisy)
    console.log("[getSpecialistDashboardData]", {
      specialistId,
      specialistOk: !specialistRes.error,
      specialistError: specialistRes.error?.message,
      consultationsCount: consultations.length,
      consultationsError: consultationsRes.error?.message,
    });
  }

  return {
    specialist: specialistRes.data ?? null,
    consultations,
  };
}

/** Coordinator dashboard: active leads, bookings in progress, consultations needing follow-up */
export async function getCoordinatorDashboardData() {
  const supabase = getServerSupabase();
  const [leadsRes, bookingsRes, consultationsRes] = await Promise.all([
    supabase.from("leads").select("id, first_name, last_name, email, status, created_at").in("status", ["new", "contacted", "qualified"]).order("created_at", { ascending: false }).limit(50),
    supabase.from("bookings").select("id, lead_id, package_id, status, created_at").in("status", ["draft", "confirmed", "in_progress", "deposit_paid", "pending"]).order("updated_at", { ascending: false }).limit(30),
    supabase
      .from("consultations")
      .select("id, lead_id, specialist_id, status, requested_at, scheduled_at")
      .in("status", ["requested", "accepted", "scheduled"])
      .order("requested_at", { ascending: false })
      .limit(30),
  ]);
  return {
    leads: leadsRes.data ?? [],
    bookings: bookingsRes.data ?? [],
    consultations: consultationsRes.data ?? [],
  };
}

/** Patient dashboard: leads matching email, their bookings, consultations, payment status. Payments are filtered in DB by lead_id. */
export async function getPatientDashboardData(email: string) {
  if (!email?.trim()) return { leads: [], bookings: [], consultations: [], payments: [] };
  const supabase = getServerSupabase();
  const { data: leads } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, status, package_slug, recommended_package_slug, created_at")
    .ilike("email", email.trim())
    .order("created_at", { ascending: false })
    .limit(10);
  const leadList = leads ?? [];
  const leadIds = leadList.map((l) => l.id);
  if (leadIds.length === 0) {
    return { leads: leadList, bookings: [], consultations: [], payments: [] };
  }
  const [bRes, cRes, pRes] = await Promise.all([
    supabase.from("bookings").select("id, lead_id, package_id, status, total_price_usd, deposit_paid, deposit_cents, start_date, end_date").in("lead_id", leadIds).order("created_at", { ascending: false }),
    supabase.from("consultations").select("id, lead_id, specialist_id, status, requested_at, scheduled_at").in("lead_id", leadIds).order("requested_at", { ascending: false }),
    supabase.from("payments").select("id, lead_id, status, amount_cents, created_at").in("lead_id", leadIds).order("created_at", { ascending: false }),
  ]);
  return {
    leads: leadList,
    bookings: bRes.data ?? [],
    consultations: cRes.data ?? [],
    payments: pRes.data ?? [],
  };
}

/** Trip builder: count + estimated add-on total for patient's leads (services marketplace). */
export async function getPatientTripItineraryStats(leadIds: string[]): Promise<{ count: number; total_cents: number }> {
  if (leadIds.length === 0) return { count: 0, total_cents: 0 };
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("itinerary_items").select("price_cents").in("lead_id", leadIds);
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[getPatientTripItineraryStats]", error.message);
    }
    return { count: 0, total_cents: 0 };
  }
  let total_cents = 0;
  for (const row of data ?? []) {
    const c = row.price_cents;
    if (typeof c === "number" && Number.isFinite(c)) total_cents += c;
  }
  return { count: data?.length ?? 0, total_cents };
}
