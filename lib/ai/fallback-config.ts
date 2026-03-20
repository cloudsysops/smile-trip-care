export type LeadIntentFallback = Readonly<{
  intent: "unknown";
  confidence: number;
}>;

export type RecommendedActionFallback = Readonly<{
  action: "manual_review";
  priority: "medium";
}>;

export type FallbackType =
  | "LEAD_SUMMARY_FALLBACK"
  | "LEAD_INTENT_FALLBACK"
  | "RECOMMENDED_ACTION_FALLBACK"
  | "LEAD_ANALYSIS_FALLBACK";

export type FallbackConfig = Readonly<{
  leadSummaryText: string;
  leadIntent: LeadIntentFallback;
  recommendedAction: RecommendedActionFallback;
}>;

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const fallbackConfig: FallbackConfig = (() => {
  const defaultLeadSummaryText = "Lead assessment pending. Please review manually.";
  const defaultLeadIntent: LeadIntentFallback = { intent: "unknown", confidence: 0 };
  const defaultRecommendedAction: RecommendedActionFallback = { action: "manual_review", priority: "medium" };

  // Optional env overrides. All parsing is defensive: if invalid, ignore and use defaults.
  const leadSummaryText = process.env.AI_FALLBACK_LEAD_SUMMARY_TEXT?.trim() || defaultLeadSummaryText;

  const leadIntentOverride = process.env.AI_FALLBACK_LEAD_INTENT_JSON
    ? safeJsonParse<Partial<{ confidence: number }>>(process.env.AI_FALLBACK_LEAD_INTENT_JSON)
    : null;

  const recommendedActionOverride = process.env.AI_FALLBACK_RECOMMENDED_ACTION_JSON
    ? safeJsonParse<Partial<{ action: string; priority: string }>>(process.env.AI_FALLBACK_RECOMMENDED_ACTION_JSON)
    : null;

  const leadIntent: LeadIntentFallback = {
    intent: "unknown",
    confidence:
      typeof leadIntentOverride?.confidence === "number" && Number.isFinite(leadIntentOverride.confidence)
        ? leadIntentOverride.confidence
        : defaultLeadIntent.confidence,
  };

  const recommendedAction: RecommendedActionFallback = {
    action: "manual_review",
    priority:
      recommendedActionOverride?.priority === "low" ||
      recommendedActionOverride?.priority === "medium" ||
      recommendedActionOverride?.priority === "high"
        ? (recommendedActionOverride.priority as RecommendedActionFallback["priority"])
        : defaultRecommendedAction.priority,
  };

  return {
    leadSummaryText,
    leadIntent,
    recommendedAction,
  };
})();

