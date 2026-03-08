import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEventMock = vi.fn();
const fromMock = vi.fn();
const enqueueDepositPaidAutomationJobsMock = vi.fn();

vi.mock("@/lib/config/server", () => ({
  getServerConfig: () => ({
    STRIPE_SECRET_KEY: "sk_test_webhook",
    STRIPE_WEBHOOK_SECRET: "whsec_webhook",
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

vi.mock("@/lib/ai/automation", () => ({
  enqueueDepositPaidAutomationJobs: enqueueDepositPaidAutomationJobsMock,
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    webhooks = {
      constructEvent: constructEventMock,
    };
  },
}));

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    constructEventMock.mockReset();
    fromMock.mockReset();
    enqueueDepositPaidAutomationJobsMock.mockReset();
    enqueueDepositPaidAutomationJobsMock.mockResolvedValue([]);
  });

  it("ignores checkout sessions with non-payment mode", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_setup",
          mode: "setup",
          payment_status: "paid",
          metadata: { lead_id: "550e8400-e29b-41d4-a716-446655440000" },
        },
      },
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, ignored: "unsupported_mode" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("ignores checkout sessions that are not paid", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_unpaid",
          mode: "payment",
          payment_status: "unpaid",
          metadata: { lead_id: "550e8400-e29b-41d4-a716-446655440000" },
        },
      },
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, ignored: "payment_not_paid" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("handles duplicate insert races safely after unique constraints", async () => {
    let paymentsSelectCalls = 0;
    fromMock.mockImplementation((table: string) => {
      if (table === "payments") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => {
                  paymentsSelectCalls += 1;
                  if (paymentsSelectCalls === 1) {
                    return { data: [], error: null };
                  }
                  return {
                    data: [{
                      id: "payment-race-1",
                      lead_id: "550e8400-e29b-41d4-a716-446655440000",
                      status: "succeeded",
                    }],
                    error: null,
                  };
                },
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: null,
                error: {
                  code: "23505",
                  message: "duplicate key value violates unique constraint",
                },
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              neq: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "leads") {
        return {
          update: () => ({
            eq: () => ({
              neq: async () => ({ error: null }),
            }),
          }),
        };
      }
      return {};
    });

    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_duplicate",
          mode: "payment",
          payment_status: "paid",
          amount_total: 150000,
          metadata: { lead_id: "550e8400-e29b-41d4-a716-446655440000" },
        },
      },
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, idempotent: true });
    expect(enqueueDepositPaidAutomationJobsMock).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
  });
});
