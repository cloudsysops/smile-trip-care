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

describe("outbound command center APIs", () => {
  beforeEach(() => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-user" } });
    fromMock.mockReset();
  });

  it("returns 403 when outbound metrics is not admin", async () => {
    requireAdminMock.mockRejectedValueOnce(new Error("Forbidden"));
    const { GET } = await import("@/app/api/admin/outbound/metrics/route");
    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Forbidden",
      request_id: expect.any(String),
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("computes outbound metrics and SLA risks", async () => {
    const now = new Date("2026-03-06T12:00:00.000Z");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(now);

      fromMock.mockImplementation((table: string) => {
        if (table === "outbound_messages") {
          return {
            select: () => ({
              order: () => ({
                limit: async () => ({
                  data: [
                    {
                      lead_id: "lead-1",
                      status: "approved",
                      channel: "whatsapp",
                      created_at: "2026-03-06T10:00:00.000Z",
                      sent_at: null,
                      delivered_at: null,
                      replied_at: null,
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "leads") {
          return {
            select: () => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      {
                        id: "lead-1",
                        first_name: "Ana",
                        last_name: "Lopez",
                        email: "ana@example.com",
                        status: "new",
                        created_at: "2026-03-06T00:00:00.000Z",
                        last_contacted_at: null,
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const { GET } = await import("@/app/api/admin/outbound/metrics/route");
      const response = await GET();
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        metrics: {
          total_outbound_messages: 1,
          actionable_queue_count: 1,
          sla_risk_count: 1,
        },
        sla_risks: [
          expect.objectContaining({
            lead_id: "lead-1",
          }),
        ],
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects invalid outbound queue query", async () => {
    const { GET } = await import("@/app/api/admin/outbound/queue/route");
    const response = await GET(new Request("http://localhost/api/admin/outbound/queue?limit=0"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid query",
      request_id: expect.any(String),
    });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
