import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const retrieveSessionMock = vi.fn();
const enqueueDepositPaidAutomationJobsMock = vi.fn();

vi.mock("@/lib/config/server", () => ({
  getServerConfigSafe: () => ({
    success: true,
    data: {
      AUTOMATION_CRON_SECRET: "automation-secret-12345",
      CRON_SECRET: "automation-secret-12345",
      STRIPE_SECRET_KEY: "sk_test_reconcile",
    },
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
    checkout = {
      sessions: {
        retrieve: retrieveSessionMock,
      },
    };
  },
}));

describe("POST /api/automation/payments-reconcile", () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    retrieveSessionMock.mockReset();
    enqueueDepositPaidAutomationJobsMock.mockReset();
    enqueueDepositPaidAutomationJobsMock.mockResolvedValue([]);
  });

  it("returns 401 when secret is missing", async () => {
    const { POST } = await import("@/app/api/automation/payments-reconcile/route");
    const response = await POST(new Request("http://localhost/api/automation/payments-reconcile", {
      method: "POST",
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      request_id: expect.any(String),
    });
  });

  it("recovers pending payments that are already paid in Stripe", async () => {
    retrieveSessionMock.mockResolvedValue({
      payment_status: "paid",
      status: "complete",
      payment_intent: "pi_1",
    });

    fromMock.mockImplementation((table: string) => {
      if (table === "payments") {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({
                lte: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [
                        {
                          id: "pay_1",
                          lead_id: "lead_1",
                          stripe_checkout_session_id: "cs_1",
                          created_at: "2026-03-07T00:00:00.000Z",
                          updated_at: "2026-03-07T00:00:00.000Z",
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: { id: "pay_1" }, error: null }),
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

    const { POST } = await import("@/app/api/automation/payments-reconcile/route");
    const response = await POST(new Request("http://localhost/api/automation/payments-reconcile", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      scanned: 1,
      recovered_succeeded: 1,
      marked_failed: 0,
      still_pending: 0,
      errors: 0,
    });
    expect(enqueueDepositPaidAutomationJobsMock).toHaveBeenCalledWith("lead_1");
  });
});
