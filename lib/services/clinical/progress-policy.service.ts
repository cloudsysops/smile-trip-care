import type { Profile } from "@/lib/auth";

const VALID_STATUSES = ["active", "completed", "cancelled"] as const;

export type ProgressRowIdentity = Readonly<{
  patient_id: string;
  specialist_id: string | null;
}>;

export type ProgressPatchUpdates = {
  stage_key?: string;
  stage_label?: string | null;
  status?: string;
  notes?: string | null;
};

export function canViewProgress(profile: Profile, row: ProgressRowIdentity): boolean {
  if (profile.role === "admin") return true;
  if (profile.role === "patient" || profile.role === "user") {
    return row.patient_id === profile.id;
  }
  if (profile.role === "specialist") {
    return row.specialist_id === profile.specialist_id;
  }
  return false;
}

export function canUpdateProgress(profile: Profile, row: ProgressRowIdentity): boolean {
  if (profile.role === "admin") return true;
  if (profile.role === "specialist") {
    return row.specialist_id === profile.specialist_id;
  }
  return false;
}

export function parseProgressPatchBody(
  body: Record<string, unknown>,
  stageKeys: readonly string[],
): { error?: string; updates: ProgressPatchUpdates } {
  const updates: ProgressPatchUpdates = {};

  const stage_key = body.stage_key;
  const stage_label = body.stage_label;
  const status = body.status;
  const notes = body.notes;

  if (stage_key !== undefined) {
    if (typeof stage_key !== "string" || !stageKeys.includes(stage_key)) {
      return { error: "Invalid stage_key", updates: {} };
    }
    updates.stage_key = stage_key;
  }

  if (stage_label !== undefined) {
    updates.stage_label = typeof stage_label === "string" ? stage_label : null;
  }

  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return { error: "Invalid status", updates: {} };
    }
    updates.status = status;
  }

  if (notes !== undefined) {
    updates.notes = typeof notes === "string" ? notes : null;
  }

  return { updates };
}

export function parseProgressCreateBody(
  body: Record<string, unknown>,
  stageKeys: readonly string[],
): { error?: string; lead_id?: string; stage_key?: string; notes?: string | null; booking_id?: string | null } {
  const lead_id = body.lead_id;
  const stage_key = body.stage_key;
  const notes = body.notes;
  const booking_id = body.booking_id;

  if (typeof lead_id !== "string" || lead_id.length === 0 || typeof stage_key !== "string" || !stageKeys.includes(stage_key)) {
    return { error: "Missing or invalid lead_id or stage_key" };
  }

  if ((notes != null && typeof notes !== "string") || (booking_id != null && typeof booking_id !== "string")) {
    return { error: "Invalid body" };
  }

  return {
    lead_id,
    stage_key,
    notes: (notes as string | null | undefined) ?? null,
    booking_id: (booking_id as string | null | undefined) ?? null,
  };
}

