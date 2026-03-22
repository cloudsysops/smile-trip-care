import { getServerSupabase } from "@/lib/supabase/server";

export { addDaysToIsoDate, serviceCategoryToItemType, tripDayFromScheduled } from "@/lib/trip-dates";

export type ItineraryItemRow = {
  id: string;
  lead_id: string;
  service_id: string | null;
  item_type: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_hours: number | null;
  price_cents: number | null;
  status: string;
  notes: string | null;
  created_at: string;
};

export async function getTripAnchorDateForLead(leadId: string): Promise<string> {
  const supabase = getServerSupabase();
  const [{ data: booking }, { data: lead }] = await Promise.all([
    supabase
      .from("bookings")
      .select("start_date")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("leads").select("created_at").eq("id", leadId).maybeSingle(),
  ]);
  const fromBooking = booking?.start_date;
  if (typeof fromBooking === "string" && /^\d{4}-\d{2}-\d{2}/.test(fromBooking)) {
    return fromBooking.slice(0, 10);
  }
  const created = lead?.created_at;
  if (typeof created === "string" && created.length >= 10) {
    return created.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

export async function listItineraryItemsForLead(leadId: string): Promise<ItineraryItemRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("itinerary_items")
    .select(
      "id, lead_id, service_id, item_type, title, description, scheduled_date, scheduled_time, duration_hours, price_cents, status, notes, created_at",
    )
    .eq("lead_id", leadId)
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ItineraryItemRow[];
}
