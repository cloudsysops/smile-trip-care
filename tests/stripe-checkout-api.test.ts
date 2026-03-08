import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const fromMock = vi.fn();
const createSessionMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/config/server", () => ({
  getServerConfig: () => ({
    STRIPE_SECRET_KEY: "sk_test_checkout",
  }),
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

vi.mock("stripe", () => ({
  default: class Stripe {
    checkout = {
      sessions: {
        create: createSessionMock,
      },
    };
  },
}));

describe("POST /api/stripe/checkout", () => {
  const leadId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-user" } });
    fromMock.mockReset();
    createSessionMock.mockReset();
  });

  it("rejects external return URLs", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          success_url: "https://evil.example.com/success",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid return URLs" });
    expect(fromMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("returns 404 when lead does not exist", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "leads") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === "payments") {
        return { insert: vi.fn() };
      }
      return {};
    });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
        }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Lead not found" });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("uses package deposit pricing even when client sends a different amount", async () => {
    const insertMock = vi.fn(async () => ({ error: null }));
    fromMock.mockImplementation((table: string) => {
      if (table === "leads") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: leadId, package_slug: "smile-medellin" }, error: null }),
            }),
          }),
        };
      }
      if (table === "packages") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { name: "Smile Transformation Medellín", deposit_cents: 75000 }, error: null }),
            }),
          }),
        };
      }
      if (table === "payments") {
        return { insert: insertMock };
      }
      return {};
    });
    createSessionMock.mockResolvedValue({ id: "cs_test_123", url: "https://stripe.example/checkout" });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const response = await POST(
      new Request("http://localhost/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          amount_cents: 50000,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://stripe.example/checkout",
      amount_cents: 75000,
      request_id: expect.any(String),
    });
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 75000,
            }),
          }),
        ],
      }),
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        lead_id: leadId,
        amount_cents: 75000,
      }),
    );
  });
});
