import Stripe from "stripe";

export type PaymentResolution = "pending" | "succeeded" | "failed";

export const HANDLED_STRIPE_WEBHOOK_TYPES = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
] as const;

export type HandledStripeWebhookType = (typeof HANDLED_STRIPE_WEBHOOK_TYPES)[number];

export function isHandledStripeWebhookType(type: string): type is HandledStripeWebhookType {
  return (HANDLED_STRIPE_WEBHOOK_TYPES as readonly string[]).includes(type);
}

/**
 * Resolve lifecycle status from a checkout session snapshot.
 * - paid => succeeded
 * - expired => failed
 * - otherwise => pending
 */
export function resolvePaymentFromCheckoutSession(
  session: Pick<Stripe.Checkout.Session, "payment_status" | "status">,
): PaymentResolution {
  if (session.payment_status === "paid") return "succeeded";
  if (session.status === "expired") return "failed";
  return "pending";
}

export function resolvePaymentFromWebhookEvent(
  eventType: HandledStripeWebhookType,
  session: Pick<Stripe.Checkout.Session, "payment_status" | "status">,
): PaymentResolution {
  if (eventType === "checkout.session.async_payment_succeeded") {
    return "succeeded";
  }
  if (eventType === "checkout.session.async_payment_failed") {
    return "failed";
  }
  return resolvePaymentFromCheckoutSession(session);
}
