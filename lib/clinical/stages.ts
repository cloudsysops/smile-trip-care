/**
 * Central config for treatment progress stages (clinical progress system).
 * Stable keys for storage; patient-friendly labels for UI.
 * Extend by adding entries to TREATMENT_STAGES; order = display order.
 */

export type TreatmentStageKey =
  | "assessment_completed"
  | "treatment_plan_ready"
  | "coordinator_follow_up"
  | "travel_planning"
  | "procedure_scheduled"
  | "procedure_completed"
  | "healing_phase"
  | "final_review";

export type TreatmentStage = Readonly<{
  key: TreatmentStageKey;
  label: string;
}>;

/** Ordered list of treatment stages (assessment → final review). */
export const TREATMENT_STAGES: readonly TreatmentStage[] = [
  { key: "assessment_completed", label: "Assessment completed" },
  { key: "treatment_plan_ready", label: "Treatment plan ready" },
  { key: "coordinator_follow_up", label: "Coordinator follow-up" },
  { key: "travel_planning", label: "Travel planning" },
  { key: "procedure_scheduled", label: "Procedure scheduled" },
  { key: "procedure_completed", label: "Procedure completed" },
  { key: "healing_phase", label: "Healing phase" },
  { key: "final_review", label: "Final review" },
] as const;

const STAGE_MAP = new Map<TreatmentStageKey, TreatmentStage>(
  TREATMENT_STAGES.map((s) => [s.key, s])
);

export function getStageByKey(key: string): TreatmentStage | null {
  return STAGE_MAP.get(key as TreatmentStageKey) ?? null;
}

export function getStageLabel(key: string): string {
  return getStageByKey(key)?.label ?? key;
}

export function getOrderedStageKeys(): TreatmentStageKey[] {
  return [...TREATMENT_STAGES].map((s) => s.key);
}
