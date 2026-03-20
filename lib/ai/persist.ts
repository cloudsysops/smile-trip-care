import { getServerSupabase } from "@/lib/supabase/server";

export type LeadAIKind = "triage" | "sales" | "ops" | "marketing";

/**
 * Persist agent output to lead_ai. Uses existing row per lead; updates the appropriate column by kind.
 */
export async function saveLeadAI(
  leadId: string,
  kind: LeadAIKind,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("lead_ai")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const column = kind === "triage" ? "triage_json" : kind === "sales" ? "messages_json" : kind === "ops" ? "ops_json" : null;
  if (!column) {
    return;
  }

  const updatePayload: Record<string, unknown> = { updated_at: now, [column]: payload };

  if (existing?.id) {
    const { error } = await supabase.from("lead_ai").update(updatePayload).eq("id", existing.id);
    if (error) throw new Error(`Failed to save lead_ai ${kind}: ${error.message}`);
  } else {
    const { error } = await supabase.from("lead_ai").insert({
      lead_id: leadId,
      ...updatePayload,
    });
    if (error) throw new Error(`Failed to insert lead_ai ${kind}: ${error.message}`);
  }
}

/**
 * Persist itinerary to itineraries table (new row per generation).
 */
export async function saveItinerary(
  leadId: string,
  payload: Record<string, unknown>,
  options: { city?: string; packageId?: string | null } = {}
): Promise<{ id: string }> {
  const supabase = getServerSupabase();
  const city = (payload.city as string) ?? options.city ?? null;
  const whatsapp_summary = (payload.whatsapp_summary as string) ?? "";

  const { data: row, error } = await supabase
    .from("itineraries")
    .insert({
      lead_id: leadId,
      package_id: options.packageId ?? null,
      city,
      content_json: payload,
      day_index: 1,
      title: "AI itinerary",
      description: whatsapp_summary,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save itinerary: ${error.message}`);
  return { id: row.id as string };
}
