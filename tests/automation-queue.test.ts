import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const upsertMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
  }),
}));

describe("automation queue enqueue", () => {
  beforeEach(() => {
    fromMock.mockReset();
    upsertMock.mockReset();
    fromMock.mockReturnValue({
      upsert: upsertMock,
    });
    upsertMock.mockReturnValue({
      select: async () => ({ data: [], error: null }),
    });
  });

  it("deduplicates job types and uses on-conflict idempotency", async () => {
    const { enqueueAutomationJobs } = await import("@/lib/automation/queue");
    await enqueueAutomationJobs({
      leadId: "550e8400-e29b-41d4-a716-446655440000",
      triggerType: "lead_created",
      jobTypes: ["lead-triage", "sales-responder", "sales-responder"],
      payload: { cta_url: "https://example.com/assessment" },
    });

    expect(fromMock).toHaveBeenCalledWith("ai_automation_jobs");
    expect(upsertMock).toHaveBeenCalledTimes(1);
    const [rows, options] = upsertMock.mock.calls[0] as [Array<Record<string, unknown>>, Record<string, unknown>];
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.job_type)).toEqual(["lead-triage", "sales-responder"]);
    expect(options).toMatchObject({
      onConflict: "lead_id,trigger_type,job_type",
      ignoreDuplicates: true,
    });
  });
});
