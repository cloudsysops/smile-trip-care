import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
  }),
}));

describe("automation queue lock recovery", () => {
  beforeEach(() => {
    fromMock.mockReset();
    updateMock.mockReset();
    fromMock.mockReturnValue({
      update: updateMock,
    });
  });

  it("reclaims stale processing jobs into retry_scheduled", async () => {
    const chain: {
      eq: ReturnType<typeof vi.fn>;
      not: ReturnType<typeof vi.fn>;
      lt: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      not: vi.fn(),
      lt: vi.fn(),
      select: vi.fn(async () => ({ data: [{ id: "job-stale-1" }, { id: "job-stale-2" }], error: null })),
    };
    chain.eq.mockReturnValue(chain);
    chain.not.mockReturnValue(chain);
    chain.lt.mockReturnValue(chain);
    updateMock.mockReturnValue(chain);

    const { recoverStuckAutomationJobs } = await import("@/lib/automation/queue");
    const recovered = await recoverStuckAutomationJobs(60_000);

    expect(fromMock).toHaveBeenCalledWith("ai_automation_jobs");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: "retry_scheduled",
      locked_at: null,
      locked_by: null,
    }));
    expect(chain.eq).toHaveBeenCalledWith("status", "processing");
    expect(chain.not).toHaveBeenCalledWith("locked_at", "is", null);
    expect(recovered).toBe(2);
  });

  it("throws when recovery query fails", async () => {
    const chain: {
      eq: ReturnType<typeof vi.fn>;
      not: ReturnType<typeof vi.fn>;
      lt: ReturnType<typeof vi.fn>;
      select: ReturnType<typeof vi.fn>;
    } = {
      eq: vi.fn(),
      not: vi.fn(),
      lt: vi.fn(),
      select: vi.fn(async () => ({ data: null, error: { message: "db down" } })),
    };
    chain.eq.mockReturnValue(chain);
    chain.not.mockReturnValue(chain);
    chain.lt.mockReturnValue(chain);
    updateMock.mockReturnValue(chain);

    const { recoverStuckAutomationJobs } = await import("@/lib/automation/queue");
    await expect(recoverStuckAutomationJobs(60_000)).rejects.toThrow("Failed to recover stuck automation jobs");
  });
});
