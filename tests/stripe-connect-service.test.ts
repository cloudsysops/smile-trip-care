import { describe, expect, it, vi, beforeEach } from "vitest";

const fromMock = vi.fn();
const accountsCreateMock = vi.fn();
const accountsRetrieveMock = vi.fn();

vi.mock("@/lib/config/server", () => ({
  getServerConfig: () => ({
    STRIPE_SECRET_KEY: "sk_test_connect",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    accounts = {
      create: accountsCreateMock,
      retrieve: accountsRetrieveMock,
    };
    constructor() {
      // no-op
    }
  },
}));

describe("stripe-connect.service", () => {
  beforeEach(() => {
    vi.resetModules();
    fromMock.mockReset();
    accountsCreateMock.mockReset();
    accountsRetrieveMock.mockReset();
  });

  it("createOrGetHostStripeAccount creates account when missing", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "hosts") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "host-1", stripe_account_id: null },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: vi.fn(),
          }),
        };
      }
      return {};
    });
    accountsCreateMock.mockResolvedValue({ id: "acct_123" });

    const { createOrGetHostStripeAccount } = await import("@/lib/services/stripe-connect.service");
    const accountId = await createOrGetHostStripeAccount("host-1");

    expect(accountId).toBe("acct_123");
    expect(accountsCreateMock).toHaveBeenCalled();
  });

  it("createOrGetSpecialistStripeAccount reuses existing account", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "specialists") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "spec-1", stripe_account_id: "acct_existing" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const { createOrGetSpecialistStripeAccount } = await import("@/lib/services/stripe-connect.service");
    const accountId = await createOrGetSpecialistStripeAccount("spec-1");

    expect(accountId).toBe("acct_existing");
    expect(accountsCreateMock).not.toHaveBeenCalled();
  });
});

