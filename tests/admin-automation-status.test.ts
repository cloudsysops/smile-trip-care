import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("GET /api/admin/status/automation", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    fromMock.mockReset();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-user" } });
  });

  it("returns 403 for non-admin callers", async () => {
    requireAdminMock.mockRejectedValueOnce(new Error("Forbidden"));
    const { GET } = await import("@/app/api/admin/status/automation/route");
    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Forbidden",
      request_id: expect.any(String),
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("returns automation and outbound reliability metrics", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-03-06T18:30:00.000Z"));

      fromMock.mockImplementation((table: string) => {
        if (table === "ai_automation_jobs") {
          return {
            select: (columns: string, options?: { count?: string; head?: boolean }) => {
              if (options?.head) {
                return {
                  eq: async (_field: string, status: string) => {
                    const counts: Record<string, number> = {
                      pending: 4,
                      processing: 1,
                      retry_scheduled: 2,
                      dead_letter: 1,
                    };
                    return { count: counts[status] ?? 0, error: null };
                  },
                };
              }
              return {
                in: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [{ created_at: "2026-03-06T18:00:00.000Z" }],
                      error: null,
                    }),
                  }),
                }),
              };
            },
          };
        }
        if (table === "outbound_messages") {
          return {
            select: () => ({
              eq: async () => ({ count: 3, error: null }),
            }),
          };
        }
        return {};
      });

      const { GET } = await import("@/app/api/admin/status/automation/route");
      const response = await GET();

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        pending_jobs: 4,
        processing_jobs: 1,
        retry_jobs: 2,
        dead_letter_jobs: 1,
        oldest_job_age: 1800,
        failed_outbound_count: 3,
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
