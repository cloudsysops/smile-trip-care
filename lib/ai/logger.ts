import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";

export type AIUsageLog = Readonly<{
  userId?: string | null;
  service: string;
  tokensUsed?: number | null;
  success: boolean;
  durationMs?: number | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}>;

/**
 * Best-effort AI usage logging.
 * If `ai_usage_logs` isn't available (e.g. migration not applied), we swallow the DB error.
 * This is critical to avoid crashing the app due to missing observability infra.
 */
export async function logAIUsage(data: AIUsageLog): Promise<void> {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  try {
    const supabase = getServerSupabase();

    const now = new Date().toISOString();
    // Try to follow the requested schema; if columns/tables differ, DB insert will fail and we swallow.
    const payload: Record<string, unknown> = {
      timestamp: now,
      user_id: data.userId ?? null,
      service: data.service,
      tokens_used: data.tokensUsed ?? null,
      success: data.success,
      duration_ms: data.durationMs ?? null,
      error_message: data.errorMessage ?? null,
      metadata: data.metadata ?? null,
    };

    const { error } = await supabase.from("ai_usage_logs").insert(payload);
    if (error) {
      log.debug("AI usage log insert skipped/failed", {
        db_error: error.message,
        service: data.service,
        success: data.success,
      });
    }
  } catch (err) {
    // Swallow on purpose.
    const msg = err instanceof Error ? err.message : String(err);
    log.debug("AI usage logging disabled/unavailable", { error: msg, service: data.service });
  }
}

