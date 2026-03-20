import { createLogger } from "@/lib/logger";
import { fallbackConfig, type FallbackType } from "@/lib/ai/fallback-config";

export type FallbackUsage = Readonly<{
  type: FallbackType;
  usedAt: number;
}>;

const fallbackUsageCount: Record<string, number> = {};

export function getFallbackUsedCount(type?: string): number {
  if (!type) return Object.values(fallbackUsageCount).reduce((a, b) => a + b, 0);
  return fallbackUsageCount[type] ?? 0;
}

export function resetFallbackUsageCount(): void {
  for (const k of Object.keys(fallbackUsageCount)) delete fallbackUsageCount[k];
}

/**
 * Returns fallback payload by type.
 * Also logs and increments in-memory fallback usage counter.
 */
export function getFallbackResponse(type: string): unknown {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const isKnown = (t: string): t is FallbackType =>
    t === "LEAD_SUMMARY_FALLBACK" || t === "LEAD_INTENT_FALLBACK" || t === "RECOMMENDED_ACTION_FALLBACK" || t === "LEAD_ANALYSIS_FALLBACK";

  if (!isKnown(type)) {
    log.warn("Fallback requested but type is unknown", { fallback_type: type });
    return null;
  }

  fallbackUsageCount[type] = (fallbackUsageCount[type] ?? 0) + 1;
  log.warn("Claude fallback used", { fallback_type: type, used_count: fallbackUsageCount[type] });

  switch (type) {
    case "LEAD_SUMMARY_FALLBACK":
      return fallbackConfig.leadSummaryText;
    case "LEAD_INTENT_FALLBACK":
      return fallbackConfig.leadIntent;
    case "RECOMMENDED_ACTION_FALLBACK":
      return fallbackConfig.recommendedAction;
    case "LEAD_ANALYSIS_FALLBACK":
      return {
        summary: fallbackConfig.leadSummaryText,
        intent: fallbackConfig.leadIntent.intent,
        confidence: fallbackConfig.leadIntent.confidence,
        action: fallbackConfig.recommendedAction.action,
        priority: fallbackConfig.recommendedAction.priority,
      };
    default:
      return null;
  }
}

