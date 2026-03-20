import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { summarizeLead, classifyLeadIntent, recommendNextStep, analyzeLeadComplete } from "@/lib/services/ai/lead-ai.service";
import { LeadSummarySchema, LeadIntentSchema, RecommendedActionSchema } from "@/lib/ai/prompts/lead-triage";

const leadId = "550e8400-e29b-41d4-a716-446655440000";

const leadRow = {
  id: leadId,
  status: "new",
  created_at: "2026-03-19T15:20:00.000Z",
  country: "Colombia",
  package_slug: "smile-medellin",
  selected_specialties: [],
  budget_range: "$5,000-$10,000",
  // Medical detail should never be forwarded to Claude in prompt text.
  message: "I want veneers and I'm ready to schedule soon.",
  utm_source: "assessment",
  landing_path: "/assessment",
} as const;

const generateStructuredResponseMock = vi.fn();

const getServerSupabaseMock = vi.fn();

function buildSupabaseMock() {
  const single = vi.fn().mockResolvedValue({ data: leadRow, error: null });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from };
}

vi.mock("@/lib/ai/claude", () => {
  return {
    generateStructuredResponse: (...args: unknown[]) => generateStructuredResponseMock(...args),
  };
});

vi.mock("@/lib/supabase/server", () => {
  return {
    getServerSupabase: () => getServerSupabaseMock(),
  };
});

describe("lead-ai.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSupabaseMock.mockReturnValue(buildSupabaseMock());
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("summarizeLead: fetches lead, sanitizes, and calls Claude once", async () => {
    generateStructuredResponseMock.mockResolvedValueOnce({ summary: "Concise dental-travel summary." });

    const res = await summarizeLead(leadId);
    expect(res).toEqual({ summary: "Concise dental-travel summary." });

    expect(generateStructuredResponseMock).toHaveBeenCalledTimes(1);
    const [prompt, schema] = generateStructuredResponseMock.mock.calls[0] as [string, unknown];

    expect(typeof prompt).toBe("string");
    expect(prompt).not.toContain("veneers and I'm ready"); // message should not be forwarded

    expect(schema).toHaveProperty("safeParse");
    expect((schema as typeof LeadSummarySchema).safeParse).toBeTypeOf("function");
  });

  it("classifyLeadIntent: calls Claude with intent schema", async () => {
    generateStructuredResponseMock.mockResolvedValueOnce({ intent: "cosmetic_tourism" });

    const res = await classifyLeadIntent(leadId);
    expect(res).toEqual({ intent: "cosmetic_tourism" });

    expect(generateStructuredResponseMock).toHaveBeenCalledTimes(1);
    const [, schema] = generateStructuredResponseMock.mock.calls[0] as [string, unknown];
    expect(schema).toHaveProperty("safeParse");
    expect((schema as typeof LeadIntentSchema).safeParse).toBeTypeOf("function");
  });

  it("recommendNextStep: calls Claude with recommended-action schema", async () => {
    generateStructuredResponseMock.mockResolvedValueOnce({ action: "send_quote" });

    const res = await recommendNextStep(leadId);
    expect(res).toEqual({ action: "send_quote" });

    expect(generateStructuredResponseMock).toHaveBeenCalledTimes(1);
    const [, schema] = generateStructuredResponseMock.mock.calls[0] as [string, unknown];
    expect(schema).toHaveProperty("safeParse");
    expect((schema as typeof RecommendedActionSchema).safeParse).toBeTypeOf("function");
  });

  it("analyzeLeadComplete: does one Claude call and returns combined result", async () => {
    generateStructuredResponseMock.mockResolvedValueOnce({
      summary: "Summary",
      intent: "price_comparison",
      action: "nurture_email",
    });

    const res = await analyzeLeadComplete(leadId);
    expect(res).toEqual({
      summary: "Summary",
      intent: "price_comparison",
      action: "nurture_email",
    });

    // Single Claude call (single generateStructuredResponse call).
    expect(generateStructuredResponseMock).toHaveBeenCalledTimes(1);
    const [prompt] = generateStructuredResponseMock.mock.calls[0] as [string, unknown];
    expect(prompt).toContain("Return STRICT JSON");
  });
});

