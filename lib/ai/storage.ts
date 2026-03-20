import type { SupabaseClient } from "@supabase/supabase-js";

type LeadAiRow = {
  id: string;
  [key: string]: unknown;
};

export async function getLatestLeadAiRow(
  supabase: SupabaseClient,
  leadId: string,
  selectColumns: string,
): Promise<{ row: LeadAiRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("lead_ai")
    .select(selectColumns)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return { row: null, error: error.message };
  }

  return { row: (data?.[0] as unknown as LeadAiRow | undefined) ?? null, error: null };
}

export async function saveLeadAiFields(args: {
  supabase: SupabaseClient;
  leadId: string;
  existingId?: string;
  fields: Record<string, unknown>;
}): Promise<string | null> {
  const now = new Date().toISOString();
  const payload = { ...args.fields, updated_at: now };

  if (args.existingId) {
    const { error } = await args.supabase
      .from("lead_ai")
      .update(payload)
      .eq("id", args.existingId);
    return error ? error.message : null;
  }

  const { error } = await args.supabase
    .from("lead_ai")
    .insert({ lead_id: args.leadId, ...payload });
  return error ? error.message : null;
}
