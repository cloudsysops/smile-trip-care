import { getServerSupabase } from "@/lib/supabase/server";

export const JOB_STATUSES = [
  "pending",
  "processing",
  "completed",
  "retry_scheduled",
  "dead_letter",
] as const;
export type AutomationJobStatus = (typeof JOB_STATUSES)[number];

export const TRIGGER_TYPES = [
  "lead_created",
  "lead_deposit_paid",
  "lead_inactive_24h",
  "lead_inactive_48h",
] as const;
export type AutomationTriggerType = (typeof TRIGGER_TYPES)[number];

export const JOB_TYPES = [
  "lead-triage",
  "sales-responder",
  "itinerary-generator",
  "ops-coordinator",
] as const;
export type AutomationJobType = (typeof JOB_TYPES)[number];

export type AutomationJobRecord = {
  id: string;
  lead_id: string;
  trigger_type: AutomationTriggerType;
  job_type: AutomationJobType;
  status: AutomationJobStatus;
  attempts: number;
  max_attempts: number;
  run_after: string;
  locked_at: string | null;
  locked_by: string | null;
  payload_json: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type EnqueueInput = {
  leadId: string;
  triggerType: AutomationTriggerType;
  jobTypes: AutomationJobType[];
  payload?: Record<string, unknown>;
  maxAttempts?: number;
  runAfter?: string;
};

const PROCESSING_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

function dedupeJobTypes(jobTypes: AutomationJobType[]): AutomationJobType[] {
  const out: AutomationJobType[] = [];
  const seen = new Set<AutomationJobType>();
  for (const jobType of jobTypes) {
    if (seen.has(jobType)) continue;
    seen.add(jobType);
    out.push(jobType);
  }
  return out;
}

function truncateError(errorMessage: string): string {
  return errorMessage.length > 800 ? errorMessage.slice(0, 800) : errorMessage;
}

export async function recoverStuckAutomationJobs(
  lockTimeoutMs: number = PROCESSING_LOCK_TIMEOUT_MS,
): Promise<number> {
  const supabase = getServerSupabase();
  const nowIso = new Date().toISOString();
  const staleBeforeIso = new Date(Date.now() - lockTimeoutMs).toISOString();

  const { data, error } = await supabase
    .from("ai_automation_jobs")
    .update({
      status: "retry_scheduled",
      run_after: nowIso,
      locked_at: null,
      locked_by: null,
      updated_at: nowIso,
      error_message: "Recovered stale processing lock",
    })
    .eq("status", "processing")
    .not("locked_at", "is", null)
    .lt("locked_at", staleBeforeIso)
    .select("id");
  if (error) {
    throw new Error(`Failed to recover stuck automation jobs: ${error.message}`);
  }
  return (data ?? []).length;
}

export async function enqueueAutomationJobs(input: EnqueueInput): Promise<AutomationJobRecord[]> {
  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const runAfter = input.runAfter ?? now;
  const maxAttempts = input.maxAttempts ?? 3;
  const jobTypes = dedupeJobTypes(input.jobTypes);
  if (jobTypes.length === 0) return [];

  const rows = jobTypes.map((jobType) => ({
    lead_id: input.leadId,
    trigger_type: input.triggerType,
    job_type: jobType,
    status: "pending" as const,
    attempts: 0,
    max_attempts: maxAttempts,
    run_after: runAfter,
    payload_json: input.payload ?? {},
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from("ai_automation_jobs")
    .upsert(rows, {
      onConflict: "lead_id,trigger_type,job_type",
      ignoreDuplicates: true,
    })
    .select(
      "id, lead_id, trigger_type, job_type, status, attempts, max_attempts, run_after, locked_at, locked_by, payload_json, error_message, created_at, updated_at",
    );
  if (error) {
    throw new Error(`Failed to enqueue automation jobs: ${error.message}`);
  }
  return (data ?? []) as AutomationJobRecord[];
}

export async function claimDueAutomationJobs(workerId: string, limit: number): Promise<AutomationJobRecord[]> {
  const supabase = getServerSupabase();
  const nowIso = new Date().toISOString();
  const { data: dueRows, error: dueError } = await supabase
    .from("ai_automation_jobs")
    .select(
      "id, lead_id, trigger_type, job_type, status, attempts, max_attempts, run_after, locked_at, locked_by, payload_json, error_message, created_at, updated_at",
    )
    .in("status", ["pending", "retry_scheduled"])
    .lte("run_after", nowIso)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (dueError) {
    throw new Error(`Failed to claim automation jobs: ${dueError.message}`);
  }

  const claimed: AutomationJobRecord[] = [];
  for (const row of (dueRows ?? []) as AutomationJobRecord[]) {
    const nextAttempts = row.attempts + 1;
    const { data: claimedRow, error: claimError } = await supabase
      .from("ai_automation_jobs")
      .update({
        status: "processing",
        attempts: nextAttempts,
        locked_at: nowIso,
        locked_by: workerId,
        updated_at: nowIso,
        error_message: null,
      })
      .eq("id", row.id)
      .in("status", ["pending", "retry_scheduled"])
      .eq("attempts", row.attempts)
      .select(
        "id, lead_id, trigger_type, job_type, status, attempts, max_attempts, run_after, locked_at, locked_by, payload_json, error_message, created_at, updated_at",
      )
      .maybeSingle();
    if (claimError) {
      throw new Error(`Failed to lock automation job ${row.id}: ${claimError.message}`);
    }
    if (claimedRow) {
      claimed.push(claimedRow as AutomationJobRecord);
    }
  }
  return claimed;
}

export async function markAutomationJobCompleted(jobId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("ai_automation_jobs")
    .update({
      status: "completed",
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", jobId);
  if (error) {
    throw new Error(`Failed to mark automation job completed: ${error.message}`);
  }
}

export async function scheduleAutomationJobRetry(
  jobId: string,
  runAfterIso: string,
  errorMessage: string,
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("ai_automation_jobs")
    .update({
      status: "retry_scheduled",
      run_after: runAfterIso,
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString(),
      error_message: truncateError(errorMessage),
    })
    .eq("id", jobId);
  if (error) {
    throw new Error(`Failed to schedule automation job retry: ${error.message}`);
  }
}

export async function markAutomationJobDeadLetter(jobId: string, errorMessage: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("ai_automation_jobs")
    .update({
      status: "dead_letter",
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString(),
      error_message: truncateError(errorMessage),
    })
    .eq("id", jobId);
  if (error) {
    throw new Error(`Failed to mark automation job dead letter: ${error.message}`);
  }
}

export function retryBackoffMs(attempts: number): number {
  const base = 60_000;
  const factor = Math.max(0, attempts - 1);
  return Math.min(base * (2 ** factor), 30 * 60_000);
}
