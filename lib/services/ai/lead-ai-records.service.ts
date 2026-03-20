import { getServerSupabase } from "@/lib/supabase/server";

type LeadForTriage = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  package_slug: string | null;
  message: string | null;
};

type LeadForResponder = LeadForTriage & {
  country: string | null;
};

type LeadAiRow = {
  id: string;
  triage_json: unknown;
};

export async function getLeadForTriage(leadId: string): Promise<LeadForTriage | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone, package_slug, message")
    .eq("id", leadId)
    .single();

  if (error || !data) return null;
  return data as unknown as LeadForTriage;
}

export async function getLeadForResponder(leadId: string): Promise<LeadForResponder | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone, country, package_slug, message")
    .eq("id", leadId)
    .single();

  if (error || !data) return null;
  return data as unknown as LeadForResponder;
}

export async function getLatestLeadAiRow(leadId: string): Promise<LeadAiRow | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("lead_ai")
    .select("id, triage_json")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const row = data?.[0];
  return row ? (row as unknown as LeadAiRow) : null;
}

export async function saveLeadAiTriage(leadId: string, triage: unknown): Promise<void> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const existing = await getLatestLeadAiRow(leadId);

  if (existing?.id) {
    const { error } = await supabase
      .from("lead_ai")
      .update({ triage_json: triage, triage_completed: true, updated_at: now })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("lead_ai").insert({
    lead_id: leadId,
    triage_json: triage,
    triage_completed: true,
    updated_at: now,
  });
  if (error) throw new Error(error.message);
}

export async function saveLeadAiMessage(leadId: string, messagePayload: unknown): Promise<void> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const existing = await getLatestLeadAiRow(leadId);

  if (existing?.id) {
    const { error } = await supabase
      .from("lead_ai")
      .update({ messages_json: messagePayload, response_generated: true, updated_at: now })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("lead_ai").insert({
    lead_id: leadId,
    messages_json: messagePayload,
    response_generated: true,
    updated_at: now,
  });
  if (error) throw new Error(error.message);
}

