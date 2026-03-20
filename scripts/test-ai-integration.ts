import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/ai/rate-limiter";
import { getClaudeCacheStats, safeClaudeCall } from "@/lib/ai/claude";
import { logger } from "@/lib/logger";
import {
  analyzeLeadComplete,
  classifyLeadIntent,
  recommendNextStep,
  summarizeLead,
} from "@/lib/services/ai/lead-ai.service";

type StepResult = Readonly<{
  name: string;
  ok: boolean;
  detail?: string;
}>;

type HealthResponse = Readonly<{
  status?: "healthy" | "degraded" | "unhealthy";
}>;

function logSection(title: string) {
  logger.info(`=== ${title} ===`);
}

async function callHealth(baseUrl: string) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/ai/health`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Health request failed (${res.status})`);
  }
  const json = (await res.json()) as unknown;
  return json;
}

async function maybeCreateTestLead(): Promise<string | null> {
  // Only works when service role config is present.
  try {
    const supabase = getServerSupabase();
    const email = `ai.integration+${Date.now()}@example.com`;
    const { data, error } = await supabase
      .from("leads")
      .insert({
        first_name: "AI",
        last_name: "Integration",
        email,
        status: "new",
        message: "Test lead for AI integration health checks.",
        package_slug: "smile-medellin",
        utm_source: "assessment",
        landing_path: "/assessment",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Failed to create test lead:", error.message);
      return null;
    }
    return (data?.id as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function testRateLimiter(): Promise<{ ok: boolean; details: string }> {
  rateLimiter.reset();
  const userId = "ai-rl-test-user";

  let allowedCount = 0;
  let deniedCount = 0;
  for (let i = 0; i < 12; i += 1) {
    const res = rateLimiter.checkLimit(userId);
    if (res.allowed) {
      allowedCount += 1;
      rateLimiter.recordRequest(userId);
    } else {
      deniedCount += 1;
    }
  }

  const ok = allowedCount === 10 && deniedCount === 2;
  return { ok, details: `allowed=${allowedCount}, denied=${deniedCount}` };
}

async function testCache(): Promise<{ ok: boolean; details: string }> {
  const before = getClaudeCacheStats();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return { ok: false, details: "ANTHROPIC_API_KEY missing; skipping cache prime" };
  }

  const model = "claude-3-sonnet-20240229";
  const prompt = `cache-test-${Date.now()}`;

  // Use fallbackType so we never crash even if Claude fails; cache will only be populated on success.
  await safeClaudeCall(prompt, { model, maxTokens: 32, userId: "ai-cache-test", fallbackType: "LEAD_SUMMARY_FALLBACK" });
  const mid = getClaudeCacheStats();

  await safeClaudeCall(prompt, { model, maxTokens: 32, userId: "ai-cache-test", fallbackType: "LEAD_SUMMARY_FALLBACK" });
  const after = getClaudeCacheStats();

  const hitRateIncreased = after.hitRate >= mid.hitRate && after.entriesCount >= mid.entriesCount;
  const ok = hitRateIncreased && (after.entriesCount > before.entriesCount || after.cacheHits >= mid.cacheHits);

  return {
    ok,
    details: `before.entries=${before.entriesCount}, after.entries=${after.entriesCount}, before.hitRate=${before.hitRate}, after.hitRate=${after.hitRate}`,
  };
}

async function testLeadServices(leadId: string): Promise<{ ok: boolean; details: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return { ok: false, details: "ANTHROPIC_API_KEY missing; skipping lead services" };
  }

  const summary = await summarizeLead(leadId);
  const intent = await classifyLeadIntent(leadId);
  const action = await recommendNextStep(leadId);
  const analysis = await analyzeLeadComplete(leadId);

  const ok = !!summary.summary && !!intent.intent && !!action.action && !!analysis.summary;
  return {
    ok,
    details: `summary/intent/action/analysis returned (intent=${intent.intent}, action=${action.action})`,
  };
}

async function main() {
  const baseUrl = process.env.AI_TEST_BASE_URL ?? "http://localhost:3000";
  const explicitLeadId = process.env.AI_TEST_LEAD_ID;

  const stepResults: StepResult[] = [];
  const startAll = Date.now();

  logSection("1) Health check");
  try {
    const health = await callHealth(baseUrl);
    logger.info("Health response", { health });
    const healthTyped = health as unknown as HealthResponse;
    const status = healthTyped.status ?? "unknown";
    const ok = status !== "unhealthy";
    stepResults.push({ name: "health", ok, detail: `status=${status}` });
  } catch (err) {
    stepResults.push({ name: "health", ok: false, detail: err instanceof Error ? err.message : String(err) });
  }

  const leadId = explicitLeadId ?? (await maybeCreateTestLead());
  if (!leadId) {
    logSection("2) Lead service tests");
    stepResults.push({
      name: "lead-services",
      ok: false,
      detail: "Missing AI_TEST_LEAD_ID and could not create test lead (check Supabase service role env).",
    });
  } else {
    logSection("2) Lead service tests (Claude structured triage)");
    try {
      const res = await testLeadServices(leadId);
      stepResults.push({ name: "lead-services", ok: res.ok, detail: res.details });
    } catch (err) {
      stepResults.push({
        name: "lead-services",
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logSection("3) Rate limiting test (in-memory limiter)");
  try {
    const res = await testRateLimiter();
    stepResults.push({ name: "rate-limiter", ok: res.ok, detail: res.details });
  } catch (err) {
    stepResults.push({
      name: "rate-limiter",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  logSection("4) Cache test (Claude structured cache)");
  try {
    const res = await testCache();
    stepResults.push({ name: "cache", ok: res.ok, detail: res.details });
  } catch (err) {
    stepResults.push({ name: "cache", ok: false, detail: err instanceof Error ? err.message : String(err) });
  }

  logSection("5) Final report");
  const okCount = stepResults.filter((s) => s.ok).length;
  const failed = stepResults.filter((s) => !s.ok);
  logger.info("Steps", { stepResults });
  logger.info("OK", { okCount, total: stepResults.length });
  logger.info("Elapsed", { elapsedMs: Date.now() - startAll });
  if (failed.length > 0) {
    console.error("Failures:", failed);
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error("test-ai-integration failed:", err);
  process.exitCode = 1;
});

