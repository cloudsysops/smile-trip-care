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

describe("outbound admin APIs", () => {
  beforeEach(() => {
    requireAdminMock.mockResolvedValue({ user: { id: "550e8400-e29b-41d4-a716-446655440010" } });
    fromMock.mockReset();
  });

  it("rejects invalid lead id before touching Supabase on outbound create", async () => {
    const { POST } = await import("@/app/api/admin/leads/[id]/outbound/route");
    const response = await POST(
      new Request("http://localhost/api/admin/leads/not-uuid/outbound", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "whatsapp",
          body_text: "Hello!",
        }),
      }),
      { params: Promise.resolve({ id: "not-uuid" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid lead id",
      request_id: expect.any(String),
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects invalid outbound status transition", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "outbound_messages") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "550e8400-e29b-41d4-a716-446655440111",
                  lead_id: "550e8400-e29b-41d4-a716-446655440000",
                  status: "replied",
                  attempts: 1,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const { PATCH } = await import("@/app/api/admin/outbound-messages/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/outbound-messages/550e8400-e29b-41d4-a716-446655440111", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "sent" }),
      }),
      { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440111" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid status transition",
      request_id: expect.any(String),
    });
  });
});
