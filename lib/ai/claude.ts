import Anthropic from "@anthropic-ai/sdk";
import { type ZodSchema } from "zod";
import { createLogger } from "@/lib/logger";
import { RateLimitError, rateLimiter } from "@/lib/ai/rate-limiter";
import { getFallbackResponse } from "@/lib/ai/fallbacks";
import { logAIUsage } from "@/lib/ai/logger";

export type ClaudeOptions = Readonly<{
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  /** Optional user identifier to enforce per-user rate limits. */
  userId?: string;
  /** Identify which fallback payload to return if Claude fails. */
  fallbackType?: string;
}>;

export type ClaudeResponse = Readonly<{
  text: string;
}>;

export type ClaudeError = Readonly<{
  message: string;
  status?: number;
  code?: string;
}>;

const DEFAULT_MODEL = "claude-sonnet-4-5";

let anthropicClient: Anthropic | null = null;

const CACHE_TTL_MS = 10 * 60_000; // 10 minutes
const responseCache: Map<string, { text: string; createdAt: number }> = new Map();
let cacheHitCount = 0;
let cacheMissCount = 0;

export function getClaudeCacheStats(): Readonly<{
  status: boolean;
  entriesCount: number;
  hitRate: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsageEstimateBytes: number;
}> {
  const entriesCount = responseCache.size;
  const total = cacheHitCount + cacheMissCount;
  const hitRate = total > 0 ? cacheHitCount / total : 0;

  // Best-effort memory estimate: sum stored text length * 2 bytes (UTF-16) + overhead.
  // Overhead varies, so we only estimate based on characters.
  let totalChars = 0;
  for (const v of responseCache.values()) {
    totalChars += v.text.length;
  }
  const memoryUsageEstimateBytes = totalChars * 2;

  return {
    status: entriesCount > 0,
    entriesCount,
    hitRate,
    cacheHits: cacheHitCount,
    cacheMisses: cacheMissCount,
    memoryUsageEstimateBytes,
  };
}

function getCacheKey(model: string, prompt: string): string {
  return `${model}:${prompt}`;
}

function getCachedResponse(model: string, prompt: string): string | null {
  const key = getCacheKey(model, prompt);
  const item = responseCache.get(key);
  if (!item) return null;
  const ageMs = Date.now() - item.createdAt;
  if (ageMs > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return item.text;
}

function setCachedResponse(model: string, prompt: string, text: string): void {
  const key = getCacheKey(model, prompt);
  responseCache.set(key, { text, createdAt: Date.now() });
}

function getAnthropicClient(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }
  anthropicClient = new Anthropic({ apiKey: apiKey.trim() });
  return anthropicClient;
}

function extractText(resp: unknown): string {
  const content = (resp as { content?: unknown } | undefined)?.content as Array<{
    type?: string;
    text?: string;
  }> | undefined;
  return (
    content?.map((c) => (c?.type === "text" ? c?.text ?? "" : "")).join("")?.trim() ?? ""
  );
}

function extractJsonText(rawText: string): unknown {
  const trimmed = rawText.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error("Claude did not return JSON object");
  }

  const jsonText = trimmed.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonText);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Claude call timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function backoffMs(attempt: number): number {
  // attempt: 1..3 => ~500ms, 1000ms, 2000ms
  return Math.min(20_000, 500 * 2 ** (attempt - 1));
}

export async function safeClaudeCall(
  prompt: string,
  options: ClaudeOptions = {},
): Promise<string | null> {
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? 1024;
  const temperature = options.temperature ?? 0.2;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const system = options.system ?? "Return strict JSON only. No markdown. No explanations.";

  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const anthropic = getAnthropicClient();

  const cacheHit = getCachedResponse(model, prompt);
  // Cache pre-check is optional. The requirements specify cache usage before fallback;
  // returning cached text early reduces calls and does not affect correctness.
  if (cacheHit) {
    cacheHitCount += 1;
    log.info("Claude response cache hit", { model, cache_age_ms: Date.now() });
    return cacheHit;
  }

  cacheMissCount += 1;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const startedAt = Date.now();
    try {
      log.info("Claude request start", { attempt, model, timeoutMs });

      const allowed = rateLimiter.checkLimit(options.userId);
      if (!allowed.allowed) {
        const retryAfterMs = allowed.retryAfter;
        log.warn("Claude request rate-limited", { attempt, retryAfterMs });
        throw new RateLimitError("claude_rate_limited", retryAfterMs);
      }
      rateLimiter.recordRequest(options.userId);

      const resp = await withTimeout(
        anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: prompt }],
            },
          ],
        }),
        timeoutMs,
      );

      const text = extractText(resp);
      if (!text) {
        throw new Error("Claude returned empty text");
      }

      const durationMs = Date.now() - startedAt;
      log.info("Claude request success", { attempt, model, durationMs });

      setCachedResponse(model, prompt, text);
      return text;
    } catch (err) {
      lastError = err;
      if (err instanceof RateLimitError) {
        // Rate limit should not be retried inside this function; surface to caller.
        throw err;
      }

      const durationMs = Date.now() - startedAt;
      const e = err as { message?: string; status?: number; code?: string };
      const status = typeof e?.status === "number" ? e.status : undefined;
      const code = e?.code;
      const message = e?.message ?? String(err);

      log.warn("Claude request failed", {
        attempt,
        model,
        durationMs,
        status,
        code,
        error: message,
      });

      // Simple rate-limit handling: if we detect HTTP 429, we still backoff.
      const isRateLimited = status === 429 || message.toLowerCase().includes("429");
      const delay = isRateLimited ? Math.max(1000, backoffMs(attempt)) : backoffMs(attempt);

      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // Claude failed after retries. Try cache (if not already hit) then fallback.
  const cachedAfterFailure = getCachedResponse(model, prompt);
  if (cachedAfterFailure) {
    cacheHitCount += 1;
    log.warn("Claude failed; returning cached response after retries", { model });
    return cachedAfterFailure;
  }

  if (options.fallbackType) {
    const fallbackType = options.fallbackType;
    const fallback = getFallbackResponse(fallbackType);
    if (fallback !== null && fallback !== undefined) {
      // Serialize into JSON text matching our structured-response contracts.
      const fallbackText =
        fallbackType === "LEAD_SUMMARY_FALLBACK"
          ? JSON.stringify({ summary: fallback })
          : fallbackType === "LEAD_INTENT_FALLBACK"
            ? JSON.stringify(fallback)
            : fallbackType === "RECOMMENDED_ACTION_FALLBACK"
              ? JSON.stringify(fallback)
              : JSON.stringify(fallback);

      // Best-effort metrics: we never throw if the DB/log infra isn't ready.
      try {
        await logAIUsage({
          userId: options.userId ?? null,
          service: "claude_structured",
          tokensUsed: null,
          success: false,
          durationMs: null,
          errorMessage: lastError instanceof Error ? lastError.message : String(lastError ?? "unknown"),
          metadata: { fallback_used: true, fallback_type: fallbackType },
        });
      } catch {
        // swallow
      }

      return fallbackText;
    }
  }

  return null;
}

/**
 * generateStructuredResponse
 * - Calls Claude
 * - Parses strict JSON object
 * - Validates with Zod schema
 * - Returns typed value
 */
export async function generateStructuredResponse<T>(
  prompt: string,
  schema: ZodSchema<T>,
  options: ClaudeOptions = {},
): Promise<T> {
  const text = await safeClaudeCall(prompt, options);
  if (!text) {
    throw new Error("Claude call failed after retries");
  }

  let parsedJson: unknown;
  try {
    parsedJson = extractJsonText(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const log = createLogger(crypto.randomUUID());
    log.error("Claude JSON parse failed", { error: message });
    throw new Error(`Claude JSON parse failed: ${message}`);
  }

  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`Claude schema validation failed: ${JSON.stringify(parsed.error.flatten())}`);
  }

  return parsed.data;
}

