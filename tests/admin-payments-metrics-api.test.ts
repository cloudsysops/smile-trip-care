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

describe("GET /api/admin/payments/metrics", () => {
  beforeEach(() => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-user" } });
    fromMock.mockReset();
  });

  it("returns 403 for non-admin users", async () => {
    requireAdminMock.mockRejectedValueOnce(new Error("Forbidden"));
    const { GET } = await import("@/app/api/admin/payments/metrics/route");
    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Forbidden",
      request_id: expect.any(String),
    });
  });

  it("computes payment reliability metrics", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-03-07T12:00:00.000Z"));
      fromMock.mockImplementation((table: string) => {
        if (table === "payments") {
          return {
            select: () => ({
              order: () => ({
                limit: async () => ({
                  data: [
                    {
                      id: "p1",
                      status: "pending",
                      created_at: "2026-03-07T09:00:00.000Z",
                      updated_at: "2026-03-07T09:00:00.000Z",
                    },
                    {
                      id: "p2",
                      status: "succeeded",
                      created_at: "2026-03-07T08:00:00.000Z",
                      updated_at: "2026-03-07T11:00:00.000Z",
                    },
                    {
                      id: "p3",
                      status: "failed",
                      created_at: "2026-03-07T07:00:00.000Z",
                      updated_at: "2026-03-07T10:30:00.000Z",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "stripe_webhook_events") {
          return {
            select: () => ({
              order: () => ({
                limit: async () => ({
                  data: [
                    {
                      status: "processed",
                      event_type: "checkout.session.completed",
                      received_at: "2026-03-07T11:30:00.000Z",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { GET } = await import("@/app/api/admin/payments/metrics/route");
      const response = await GET();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        metrics: {
          pending_count: 1,
          pending_over_15m: 1,
          succeeded_last_24h: 1,
          failed_last_24h: 1,
          webhook_processed_last_24h: 1,
        },
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
