import { beforeEach, describe, expect, it, vi } from "vitest";

const constructEventMock = vi.fn();
const fromMock = vi.fn();

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
  enqueueDepositPaidAutomationJobs: vi.fn(),
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
  });

  it("ignores checkout sessions that are not paid", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_unpaid",
          mode: "payment",
          payment_status: "unpaid",
          metadata: {},
        },
      },
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "test-signature",
      },
      body: "{}",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
