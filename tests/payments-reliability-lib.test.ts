import { describe, expect, it } from "vitest";
import {
  resolvePaymentFromCheckoutSession,
  resolvePaymentFromWebhookEvent,
} from "@/lib/payments/reliability";

describe("payments reliability helpers", () => {
  it("resolves checkout session payment lifecycle", () => {
    expect(resolvePaymentFromCheckoutSession({
      payment_status: "paid",
      status: "complete",
    })).toBe("succeeded");

    expect(resolvePaymentFromCheckoutSession({
      payment_status: "unpaid",
      status: "expired",
    })).toBe("failed");

    expect(resolvePaymentFromCheckoutSession({
      payment_status: "unpaid",
      status: "open",
    })).toBe("pending");
  });

  it("resolves webhook events with async overrides", () => {
    expect(resolvePaymentFromWebhookEvent("checkout.session.async_payment_succeeded", {
      payment_status: "unpaid",
      status: "open",
    })).toBe("succeeded");

    expect(resolvePaymentFromWebhookEvent("checkout.session.async_payment_failed", {
      payment_status: "paid",
      status: "complete",
    })).toBe("failed");

    expect(resolvePaymentFromWebhookEvent("checkout.session.completed", {
      payment_status: "paid",
      status: "complete",
    })).toBe("succeeded");
  });
});
