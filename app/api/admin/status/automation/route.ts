import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";

async function countRowsByStatus(table: "ai_automation_jobs" | "outbound_messages", status: string): Promise<number> {
  const supabase = getServerSupabase();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (error) {
    throw new Error(`Failed counting ${table}(${status}): ${error.message}`);
  }
  return count ?? 0;
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  try {
    const [pendingJobs, processingJobs, retryJobs, deadLetterJobs, failedOutboundCount] = await Promise.all([
      countRowsByStatus("ai_automation_jobs", "pending"),
      countRowsByStatus("ai_automation_jobs", "processing"),
      countRowsByStatus("ai_automation_jobs", "retry_scheduled"),
      countRowsByStatus("ai_automation_jobs", "dead_letter"),
      countRowsByStatus("outbound_messages", "failed"),
    ]);

    const supabase = getServerSupabase();
    const { data: oldestRows, error: oldestError } = await supabase
      .from("ai_automation_jobs")
      .select("created_at")
      .in("status", ["pending", "processing", "retry_scheduled", "dead_letter"])
      .order("created_at", { ascending: true })
      .limit(1);
    if (oldestError) {
      throw new Error(`Failed loading oldest automation job: ${oldestError.message}`);
    }

    const oldestIso = oldestRows?.[0]?.created_at as string | undefined;
    const oldestAgeSeconds = oldestIso
      ? Math.max(0, Math.floor((Date.now() - new Date(oldestIso).getTime()) / 1000))
      : 0;

    return NextResponse.json({
      pending_jobs: pendingJobs,
      processing_jobs: processingJobs,
      retry_jobs: retryJobs,
      dead_letter_jobs: deadLetterJobs,
      oldest_job_age: oldestAgeSeconds,
      failed_outbound_count: failedOutboundCount,
      request_id: requestId,
    });
  } catch (error) {
    log.error("Failed to load automation status summary", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
