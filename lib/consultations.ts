import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type ConsultationStatus = "requested" | "scheduled" | "completed" | "cancelled";

export type ConsultationRow = {
  id: string;
  lead_id: string;
  specialist_id: string;
  status: ConsultationStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const CONSULTATION_SELECT =
  "id, lead_id, specialist_id, status, scheduled_date, scheduled_time, scheduled_at, notes, created_at, updated_at";

/** Fetch all consultations (admin). */
export async function getConsultations(): Promise<ConsultationRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("consultations")
      .select(CONSULTATION_SELECT)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as ConsultationRow[];
  } catch {
    return [];
  }
}

/** Fetch consultations by lead_id. */
export async function getConsultationsByLeadId(leadId: string): Promise<ConsultationRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("consultations")
      .select(CONSULTATION_SELECT)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as ConsultationRow[];
  } catch {
    return [];
  }
}

/** Fetch one consultation by id. */
export async function getConsultationById(id: string): Promise<ConsultationRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("consultations")
      .select(CONSULTATION_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as ConsultationRow;
  } catch {
    return null;
  }
}

export type ConsultationInsert = Omit<ConsultationRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ConsultationUpsertResult = { data: ConsultationRow | null; error: string | null };

/** Create a consultation (admin only). */
export async function createConsultation(payload: ConsultationInsert): Promise<ConsultationUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("consultations")
      .insert({
        lead_id: payload.lead_id,
        specialist_id: payload.specialist_id,
        status: payload.status ?? "requested",
        scheduled_date: payload.scheduled_date ?? null,
        scheduled_time: payload.scheduled_time ?? null,
        scheduled_at: payload.scheduled_at ?? null,
        notes: payload.notes ?? null,
      })
      .select(CONSULTATION_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ConsultationRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Update a consultation (admin only). */
export async function updateConsultation(
  id: string,
  payload: Partial<ConsultationInsert>
): Promise<ConsultationUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("consultations")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(CONSULTATION_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ConsultationRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
