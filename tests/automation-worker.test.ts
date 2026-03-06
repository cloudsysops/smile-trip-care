import { beforeEach, describe, expect, it, vi } from "vitest";

const claimDueAutomationJobsMock = vi.fn();
const markAutomationJobCompletedMock = vi.fn();
const scheduleAutomationJobRetryMock = vi.fn();
const markAutomationJobDeadLetterMock = vi.fn();
const recoverStuckAutomationJobsMock = vi.fn();
const retryBackoffMsMock = vi.fn();
const executeAutomationJobMock = vi.fn();

vi.mock("@/lib/config/server", () => ({
  getServerConfigSafe: () => ({
    success: true,
    data: { AUTOMATION_CRON_SECRET: "automation-secret-12345" },
  }),
}));

vi.mock("@/lib/automation/queue", () => ({
  recoverStuckAutomationJobs: recoverStuckAutomationJobsMock,
  claimDueAutomationJobs: claimDueAutomationJobsMock,
  markAutomationJobCompleted: markAutomationJobCompletedMock,
  scheduleAutomationJobRetry: scheduleAutomationJobRetryMock,
  markAutomationJobDeadLetter: markAutomationJobDeadLetterMock,
  retryBackoffMs: retryBackoffMsMock,
}));

vi.mock("@/lib/ai/automation", () => ({
  executeAutomationJob: executeAutomationJobMock,
}));

describe("POST /api/automation/worker", () => {
  beforeEach(() => {
    recoverStuckAutomationJobsMock.mockReset();
    claimDueAutomationJobsMock.mockReset();
    markAutomationJobCompletedMock.mockReset();
    scheduleAutomationJobRetryMock.mockReset();
    markAutomationJobDeadLetterMock.mockReset();
    retryBackoffMsMock.mockReset();
    executeAutomationJobMock.mockReset();
    recoverStuckAutomationJobsMock.mockResolvedValue(0);
    retryBackoffMsMock.mockReturnValue(60_000);
  });

  it("marks jobs completed on successful execution", async () => {
    claimDueAutomationJobsMock.mockResolvedValue([
      {
        id: "job-1",
        lead_id: "lead-1",
        trigger_type: "lead_created",
        job_type: "lead-triage",
        attempts: 1,
        max_attempts: 3,
      },
    ]);
    executeAutomationJobMock.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/automation/worker/route");
    const response = await POST(new Request("http://localhost/api/automation/worker", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      recovered: 0,
      claimed: 1,
      completed: 1,
      retried: 0,
      dead_letter: 0,
      request_id: expect.any(String),
    });
    expect(markAutomationJobCompletedMock).toHaveBeenCalledWith("job-1");
  });

  it("schedules retry when execution fails before max attempts", async () => {
    claimDueAutomationJobsMock.mockResolvedValue([
      {
        id: "job-2",
        lead_id: "lead-2",
        trigger_type: "lead_created",
        job_type: "sales-responder",
        attempts: 1,
        max_attempts: 3,
      },
    ]);
    executeAutomationJobMock.mockRejectedValue(new Error("temporary failure"));

    const { POST } = await import("@/app/api/automation/worker/route");
    const response = await POST(new Request("http://localhost/api/automation/worker", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      ok: true,
      recovered: 0,
      claimed: 1,
      completed: 0,
      retried: 1,
      dead_letter: 0,
    });
    expect(scheduleAutomationJobRetryMock).toHaveBeenCalledTimes(1);
    expect(markAutomationJobDeadLetterMock).not.toHaveBeenCalled();
  });

  it("marks dead_letter when max attempts are reached", async () => {
    claimDueAutomationJobsMock.mockResolvedValue([
      {
        id: "job-3",
        lead_id: "lead-3",
        trigger_type: "lead_deposit_paid",
        job_type: "ops-coordinator",
        attempts: 3,
        max_attempts: 3,
      },
    ]);
    executeAutomationJobMock.mockRejectedValue(new Error("permanent failure"));

    const { POST } = await import("@/app/api/automation/worker/route");
    const response = await POST(new Request("http://localhost/api/automation/worker", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      ok: true,
      recovered: 0,
      claimed: 1,
      completed: 0,
      retried: 0,
      dead_letter: 1,
    });
    expect(markAutomationJobDeadLetterMock).toHaveBeenCalledWith("job-3", "permanent failure");
    expect(scheduleAutomationJobRetryMock).not.toHaveBeenCalled();
  });

  it("includes recovered stale-lock count in worker result", async () => {
    recoverStuckAutomationJobsMock.mockResolvedValue(2);
    claimDueAutomationJobsMock.mockResolvedValue([]);

    const { POST } = await import("@/app/api/automation/worker/route");
    const response = await POST(new Request("http://localhost/api/automation/worker", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      recovered: 2,
      claimed: 0,
      completed: 0,
      retried: 0,
      dead_letter: 0,
    });
  });
});
