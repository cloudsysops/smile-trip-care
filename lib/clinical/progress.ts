/**
 * Server-side helpers for treatment progress (clinical progress system).
 * Resolves patient_id from lead.email → profile.email; RLS applies via getServerSupabase().
 */
import { getServerSupabase } from "@/lib/supabase/server";
import { getStageLabel } from "./stages";

export type TreatmentProgressRow = {
  id: string;
  patient_id: string;
  specialist_id: string | null;
  lead_id: string | null;
  booking_id: string | null;
  stage_key: string;
  stage_label: string;
  status: string;
  notes: string | null;
  attachments: unknown;
  created_at: string;
  updated_at: string;
};

/**
 * Resolve patient_id (profiles.id) from lead_id.
 * Uses lead.email → profile with matching email (case-sensitive match per DB).
 * Returns null if no profile has that email (known limitation: patient must have account).
 */
export async function resolvePatientIdFromLead(leadId: string): Promise<string | null> {
  const supabase = getServerSupabase();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("email")
    .eq("id", leadId)
    .single();
  if (leadError || !lead?.email?.trim()) return null;
  const email = (lead.email as string).trim();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  return profile?.id ?? null;
}

/**
 * Check that the given specialist has a consultation for this lead (allowed to add progress).
 */
export async function specialistHasConsultationForLead(
  specialistId: string,
  leadId: string
): Promise<boolean> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("consultations")
    .select("id")
    .eq("specialist_id", specialistId)
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle();
  return !error && !!data?.id;
}

/**
 * List treatment progress for a patient (ordered by created_at desc).
 * Caller must ensure auth.uid() = patientId for patient role (RLS enforces).
 */
export async function getProgressForPatient(patientId: string): Promise<TreatmentProgressRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("treatment_progress")
    .select("id, patient_id, specialist_id, lead_id, booking_id, stage_key, stage_label, status, notes, attachments, created_at, updated_at")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as TreatmentProgressRow[];
}

/**
 * List treatment progress rows where specialist_id = given specialist.
 * RLS allows when profile.specialist_id matches.
 */
export async function getProgressForSpecialist(specialistId: string): Promise<TreatmentProgressRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("treatment_progress")
    .select("id, patient_id, specialist_id, lead_id, booking_id, stage_key, stage_label, status, notes, attachments, created_at, updated_at")
    .eq("specialist_id", specialistId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TreatmentProgressRow[];
}

/**
 * List all treatment progress (admin only). RLS allows when is_admin().
 */
export async function getProgressForAdmin(): Promise<TreatmentProgressRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("treatment_progress")
    .select("id, patient_id, specialist_id, lead_id, booking_id, stage_key, stage_label, status, notes, attachments, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TreatmentProgressRow[];
}

/**
 * Get latest treatment progress row for a lead (by lead_id). Used in admin for visibility.
 * RLS: admin can read all; returns null if none.
 */
export async function getLatestProgressForLead(leadId: string): Promise<TreatmentProgressRow | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("treatment_progress")
    .select("id, patient_id, specialist_id, lead_id, booking_id, stage_key, stage_label, status, notes, attachments, created_at, updated_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as TreatmentProgressRow | null;
}

/**
 * Get one treatment_progress row by id. RLS applies (patient/specialist/admin).
 */
export async function getProgressById(id: string): Promise<TreatmentProgressRow | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("treatment_progress")
    .select("id, patient_id, specialist_id, lead_id, booking_id, stage_key, stage_label, status, notes, attachments, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as TreatmentProgressRow | null;
}

type CreateProgressInput = {
  patient_id: string;
  specialist_id: string;
  lead_id?: string | null;
  booking_id?: string | null;
  stage_key: string;
  stage_label?: string | null;
  status?: string;
  notes?: string | null;
};

/**
 * Insert one treatment_progress row. RLS applies (specialist must match auth).
 */
export async function createProgress(input: CreateProgressInput): Promise<TreatmentProgressRow> {
  const supabase = getServerSupabase();
  const label = input.stage_label ?? getStageLabel(input.stage_key);
  const { data, error } = await supabase
    .from("treatment_progress")
    .insert({
      patient_id: input.patient_id,
      specialist_id: input.specialist_id,
      lead_id: input.lead_id ?? null,
      booking_id: input.booking_id ?? null,
      stage_key: input.stage_key,
      stage_label: label,
      status: input.status ?? "active",
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .select("id, patient_id, specialist_id, lead_id, booking_id, stage_key, stage_label, status, notes, attachments, created_at, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data as TreatmentProgressRow;
}

type UpdateProgressInput = {
  stage_key?: string;
  stage_label?: string | null;
  status?: string;
  notes?: string | null;
};

/**
 * Update one treatment_progress row by id. RLS restricts to specialist own or admin.
 */
export async function updateProgress(id: string, input: UpdateProgressInput): Promise<TreatmentProgressRow> {
  const supabase = getServerSupabase();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.stage_key != null) {
    payload.stage_key = input.stage_key;
    payload.stage_label = input.stage_label ?? getStageLabel(input.stage_key);
  } else if (input.stage_label !== undefined) {
    payload.stage_label = input.stage_label;
  }
  if (input.status != null) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = input.notes;
  const { data, error } = await supabase
    .from("treatment_progress")
    .update(payload)
    .eq("id", id)
    .select("id, patient_id, specialist_id, lead_id, booking_id, stage_key, stage_label, status, notes, attachments, created_at, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data as TreatmentProgressRow;
}
