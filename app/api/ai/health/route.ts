import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/ai/rate-limiter";
import { getClaudeCacheStats } from "@/lib/ai/claude";
import { createLogger } from "@/lib/logger";

const VERSION = "1.0.0";

function extractClaudeText(resp: unknown): string {
  const content = (resp as { content?: unknown } | undefined)?.content as Array<{
    type?: string;
    text?: string;
  }> | undefined;
  const text =
    content?.map((c) => (c?.type === "text" ? c?.text ?? "" : "")).join("")?.trim() ?? "";
  return text;
}

async function timeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Claude health check timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

function startOfTodayUTC(now = new Date()): string {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const timestamp = new Date().toISOString();

  const checks: {
    claude: { status: boolean; latency_ms: number };
    rateLimiter: { status: boolean; availableCapacity: number } & {
      maxRequestsPerMinuteGlobal?: number;
      maxRequestsPerMinutePerUser?: number;
      windowMs?: number;
    };
    cache: { status: boolean; hitRate: number } & {
      entriesCount?: number;
      memoryUsageEstimateBytes?: number;
    };
    database: { status: boolean; logsToday: number } & { lastSuccessfulLogAt?: string | null };
  } = {
    claude: { status: false, latency_ms: 0 },
    rateLimiter: { status: true, availableCapacity: 0 },
    cache: { status: false, hitRate: 0 },
    database: { status: false, logsToday: 0 },
  };

  // Claude connectivity check (direct call; do NOT use safeClaudeCall to avoid cache/fallback masking connectivity).
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey || typeof anthropicApiKey !== "string" || !anthropicApiKey.trim()) {
    log.warn("Claude health: missing ANTHROPIC_API_KEY");
    checks.claude.latency_ms = 0;
    checks.claude.status = false;
  } else {
    const start = Date.now();
    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey.trim() });

      const resp = await timeout(
        anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          max_tokens: 8,
          temperature: 0,
          system: "Return a short text response only.",
          messages: [{ role: "user", content: [{ type: "text", text: `ping-${Date.now()}` }] }],
        }),
        5000,
      );

      const text = extractClaudeText(resp);
      const latencyMs = Date.now() - start;
      checks.claude.latency_ms = latencyMs;
      checks.claude.status = text.length > 0;
    } catch (err) {
      const latencyMs = Date.now() - start;
      checks.claude.latency_ms = latencyMs;
      checks.claude.status = false;
      log.warn("Claude health check failed", {
        error: err instanceof Error ? err.message : String(err),
        latency_ms: latencyMs,
      });
    }
  }

  // Rate limiter status: since endpoint is public, we check global capacity.
  const rlStatus = rateLimiter.getStatus();
  checks.rateLimiter.availableCapacity = rlStatus.availableCapacity;
  checks.rateLimiter.status = rlStatus.availableCapacity > 0;
  // Extra operator info (not part of required minimal schema).
  (checks.rateLimiter as Record<string, unknown>).maxRequestsPerMinuteGlobal = rlStatus.maxRequestsPerMinuteGlobal;
  (checks.rateLimiter as Record<string, unknown>).maxRequestsPerMinutePerUser = rlStatus.maxRequestsPerMinutePerUser;
  (checks.rateLimiter as Record<string, unknown>).windowMs = rlStatus.windowMs;

  // Cache status.
  const cacheStats = getClaudeCacheStats();
  checks.cache.status = cacheStats.entriesCount > 0;
  checks.cache.hitRate = cacheStats.hitRate;
  (checks.cache as Record<string, unknown>).entriesCount = cacheStats.entriesCount;
  (checks.cache as Record<string, unknown>).memoryUsageEstimateBytes = cacheStats.memoryUsageEstimateBytes;

  // Database connectivity: ai_usage_logs table best-effort.
  try {
    const supabase = getServerSupabase();
    const since = startOfTodayUTC();

    const { count } = await supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .gte("timestamp", since);

    const logsToday = count ?? 0;

    const { data: lastRows, error: lastErr } = await supabase
      .from("ai_usage_logs")
      .select("timestamp")
      .eq("success", true)
      .order("timestamp", { ascending: false })
      .limit(1);

    if (lastErr) {
      log.warn("AI usage logs last successful query failed", { error: lastErr.message });
    }

    checks.database.logsToday = logsToday;
    checks.database.status = true;

    // We still log the last successful timestamp for operator visibility.
    const lastSuccessfulLogAt = (lastRows?.[0]?.timestamp as string | undefined) ?? null;
    (checks.database as Record<string, unknown>).lastSuccessfulLogAt = lastSuccessfulLogAt;
    if (lastSuccessfulLogAt) {
      log.info("AI usage logs last successful", { lastSuccessfulLogAt });
    }
  } catch (err) {
    log.warn("AI usage logs DB connectivity failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    checks.database.status = false;
    checks.database.logsToday = 0;
  }

  const status =
    checks.claude.status &&
    checks.rateLimiter.status &&
    checks.cache.status &&
    checks.database.status
      ? "healthy"
      : checks.claude.status
        ? "degraded"
        : "unhealthy";

  return NextResponse.json(
    {
      status,
      timestamp,
      checks,
      version: VERSION,
    },
    { status: 200 },
  );
}

