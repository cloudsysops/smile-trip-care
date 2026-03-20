import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  LeadIntentSchema,
  LeadSummarySchema,
  RecommendedActionSchema,
  type LeadIntent,
  type LeadSummary,
  type RecommendedAction,
} from "@/lib/ai/prompts/lead-triage";
import { rateLimiter } from "@/lib/ai/rate-limiter";
import { resetFallbackUsageCount, getFallbackUsedCount } from "@/lib/ai/fallbacks";

const createMock = vi.fn().mockRejectedValue(new Error("Claude API failure"));

vi.mock("@anthropic-ai/sdk", () => {
  class AnthropicMock {
    public messages = { create: createMock };
    constructor() {
      // no-op
    }
  }
  return { default: AnthropicMock };
});

describe("Claude fallbacks", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test_key";
    rateLimiter.reset();
    resetFallbackUsageCount();
    createMock.mockClear();
  });

  it("returns LEAD_SUMMARY fallback when Claude fails", async () => {
    const { generateStructuredResponse } = await import("@/lib/ai/claude");
    const res = await generateStructuredResponse<LeadSummary>("prompt", LeadSummarySchema, {
      userId: "user-1",
      fallbackType: "LEAD_SUMMARY_FALLBACK",
      maxTokens: 64,
    });

    expect(res.summary).toBe("Lead assessment pending. Please review manually.");
    expect(getFallbackUsedCount("LEAD_SUMMARY_FALLBACK")).toBe(1);
  });

  it("returns LEAD_INTENT fallback when Claude fails", async () => {
    const { generateStructuredResponse } = await import("@/lib/ai/claude");
    const res = await generateStructuredResponse<LeadIntent>("prompt", LeadIntentSchema, {
      userId: "user-1",
      fallbackType: "LEAD_INTENT_FALLBACK",
      maxTokens: 64,
    });

    expect(res.intent).toBe("unknown");
    expect(res.confidence).toBe(0);
    expect(getFallbackUsedCount("LEAD_INTENT_FALLBACK")).toBe(1);
  });

  it("returns RECOMMENDED_ACTION fallback when Claude fails", async () => {
    const { generateStructuredResponse } = await import("@/lib/ai/claude");
    const res = await generateStructuredResponse<RecommendedAction>("prompt", RecommendedActionSchema, {
      userId: "user-1",
      fallbackType: "RECOMMENDED_ACTION_FALLBACK",
      maxTokens: 64,
    });

    expect(res.action).toBe("manual_review");
    expect(res.priority).toBe("medium");
    expect(getFallbackUsedCount("RECOMMENDED_ACTION_FALLBACK")).toBe(1);
  });
});

