import { getServerSupabase } from "@/lib/supabase/server";

export type PatientPipelineStage =
  | "lead_created"
  | "assessment_submitted"
  | "deposit_paid"
  | "consultation_scheduled"
  | "treatment_in_progress"
  | "treatment_completed"
  | "followup_in_progress"
  | "archived";

export type PatientPipelineEntry = {
  id: string;
  patient_id: string;
  assessment_id: string | null;
  stage: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type RecordStageTransitionInput = {
  patientId: string;
  assessmentId?: string | null;
  stage: PatientPipelineStage | string;
  notes?: string | null;
};

export async function recordStageTransition(
  input: RecordStageTransitionInput
): Promise<{ entry: PatientPipelineEntry | null; error: string | null }> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("patient_pipeline")
    .insert({
      patient_id: input.patientId,
      assessment_id: input.assessmentId ?? null,
      stage: input.stage,
      notes: input.notes ?? null,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return { entry: null, error: error.message };
  }

  return { entry: data as PatientPipelineEntry, error: null };
}

export async function getPatientPipeline(
  patientId: string
): Promise<PatientPipelineEntry[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("patient_pipeline")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as PatientPipelineEntry[];
}

export async function getLatestPatientStage(
  patientId: string
): Promise<PatientPipelineEntry | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("patient_pipeline")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PatientPipelineEntry;
}

