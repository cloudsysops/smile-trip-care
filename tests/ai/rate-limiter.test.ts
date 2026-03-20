import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from "vitest";

describe("Claude rate limiter (in-memory)", () => {
  let rateLimiter: import("@/lib/ai/rate-limiter").RateLimiter;

  const baseTime = new Date("2026-03-19T00:00:00.000Z");

  beforeAll(async () => {
    // Ensure fake timers are enabled before importing the singleton instance.
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);

    const mod = await import("@/lib/ai/rate-limiter");
    rateLimiter = mod.rateLimiter;
  });

  beforeEach(() => {
    rateLimiter.reset();
    vi.setSystemTime(baseTime);
  });

  afterEach(() => {
    // Keep interval active for the singleton; we only reset time/state per test.
    vi.setSystemTime(baseTime);
  });

  it("enforces MAX_REQUESTS_PER_MINUTE_PER_USER (10)", () => {
    const userId = "user-1";

    let allowedCount = 0;
    let firstDeniedRetryAfter: number | undefined;

    for (let i = 0; i < 100; i += 1) {
      const res = rateLimiter.checkLimit(userId);
      if (res.allowed) {
        allowedCount += 1;
        rateLimiter.recordRequest(userId);
      } else {
        if (firstDeniedRetryAfter === undefined) firstDeniedRetryAfter = res.retryAfter;
      }
    }

    expect(allowedCount).toBe(10);
    expect(firstDeniedRetryAfter).toBeGreaterThan(0);

    // After the window moves forward, user should be able to call again.
    vi.advanceTimersByTime(60_000 + 1);
    const afterWindow = rateLimiter.checkLimit(userId);
    expect(afterWindow.allowed).toBe(true);
  });

  it("cleans up old request logs automatically via interval", () => {
    const userId = "user-2";

    rateLimiter.recordRequest(userId);
    const rlAny = rateLimiter as unknown as { requestLogs: Map<string, Array<{ timestamp: number }>> };
    expect(rlAny.requestLogs.size).toBeGreaterThan(0);

    // Move time forward past the cleanup interval.
    vi.advanceTimersByTime(60_000 + 1);
    vi.runOnlyPendingTimers();

    const after = rlAny.requestLogs;
    // All old logs should be pruned and entries removed.
    expect(after.size).toBe(0);
  });
});

