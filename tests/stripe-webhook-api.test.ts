import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const constructEventMock = vi.fn();
const enqueueDepositPaidAutomationJobsMock = vi.fn();

vi.mock("@/lib/config/server", () => ({
  getServerConfig: () => ({
    STRIPE_SECRET_KEY: "sk_test_webhook",
    STRIPE_WEBHOOK_SECRET: "whsec_test_webhook",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/lib/ai/automation", () => ({
  enqueueDepositPaidAutomationJobs: enqueueDepositPaidAutomationJobsMock,
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
    webhooks = {
      constructEvent: constructEventMock,
    };
  },
}));

describe("POST /api/stripe/webhook", () => {
  const leadId = "550e8400-e29b-41d4-a716-446655440111";

  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    constructEventMock.mockReset();
    enqueueDepositPaidAutomationJobsMock.mockReset();
    enqueueDepositPaidAutomationJobsMock.mockResolvedValue([]);
  });

  it("returns idempotent response when webhook event is duplicated", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      api_version: "2026-02-25.clover",
      livemode: false,
      data: {
        object: {
          id: "cs_1",
          amount_total: 50000,
          payment_intent: "pi_1",
          payment_status: "paid",
          status: "complete",
          metadata: { lead_id: leadId },
        },
      },
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "stripe_webhook_events") {
        return {
          upsert: () => ({
            select: () => ({
              limit: async () => ({ data: [], error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=fake" },
      body: "{}",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
      idempotent: true,
    });
  });

  it("marks pending payment as succeeded for async success event", async () => {
    let paymentPatch: Record<string, unknown> | null = null;
    constructEventMock.mockReturnValue({
      id: "evt_2",
      type: "checkout.session.async_payment_succeeded",
      api_version: "2026-02-25.clover",
      livemode: false,
      data: {
        object: {
          id: "cs_2",
          amount_total: 75000,
          payment_intent: "pi_2",
          payment_status: "paid",
          status: "complete",
          metadata: { lead_id: leadId },
        },
      },
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "stripe_webhook_events") {
        return {
          upsert: () => ({
            select: () => ({
              limit: async () => ({ data: [{ id: "swe_1" }], error: null }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      if (table === "payments") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({
                  data: [{ id: "pay_1", lead_id: leadId, status: "pending" }],
                  error: null,
                }),
              }),
            }),
          }),
          update: (patch: Record<string, unknown>) => {
            paymentPatch = patch;
            return {
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    maybeSingle: async () => ({ data: { id: "pay_1" }, error: null }),
                  }),
                }),
              }),
            };
          },
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

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=fake" },
      body: "{}",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      received: true,
    });
    expect(paymentPatch).toMatchObject({
      status: "succeeded",
      stripe_payment_intent_id: "pi_2",
    });
    expect(enqueueDepositPaidAutomationJobsMock).toHaveBeenCalledWith(leadId);
  });
});
