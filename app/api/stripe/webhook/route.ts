import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { UuidSchema } from "@/lib/validation/common";
import { jsonBadRequest, jsonInternalServerError } from "@/lib/http/response";

const CheckoutSessionMetadataSchema = z.object({
  lead_id: UuidSchema,
});

/**
 * Stripe webhook: MUST use raw body for signature verification.
 * Production endpoint path: /api/stripe/webhook.
 */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfig();
  if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
    log.error("Stripe webhook env missing");
    return jsonInternalServerError(requestId);
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    log.warn("Webhook missing stripe-signature");
    return jsonBadRequest("Missing signature", requestId);
  }
  let payload: string;
  try {
    payload = await request.text();
  } catch {
    log.error("Failed to read raw body");
    return jsonBadRequest("Bad body", requestId);
  }
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(
      payload,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    log.warn("Webhook signature verification failed", { err: String(err) });
    return jsonBadRequest("Invalid signature", requestId);
  }
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, request_id: requestId });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const metadataParsed = CheckoutSessionMetadataSchema.safeParse(session.metadata ?? {});
  if (!metadataParsed.success) {
    log.warn("checkout.session.completed with invalid lead_id metadata");
    return NextResponse.json({ received: true, request_id: requestId });
  }
  const { lead_id: leadId } = metadataParsed.data;
  const supabase = getServerSupabase();

  const { data: payment, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id, status, lead_id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (paymentLookupError) {
    log.error("Failed to lookup payment", { error: paymentLookupError.message, session_id: sessionId });
    return jsonInternalServerError(requestId);
  }
  if (!payment) {
    log.warn("Webhook received unknown checkout session", { session_id: sessionId });
    return NextResponse.json({ received: true, request_id: requestId });
  }

  if (payment.status !== "succeeded") {
    const { error: updatePayError } = await supabase
      .from("payments")
      .update({ status: "succeeded", updated_at: new Date().toISOString() })
      .eq("id", payment.id)
      .neq("status", "succeeded");
    if (updatePayError) {
      log.error("Failed to update payment", { error: updatePayError.message, payment_id: payment.id });
      return jsonInternalServerError(requestId);
    }
  } else {
    log.info("Webhook already processed for payment", { payment_id: payment.id, session_id: sessionId });
  }

  const leadIdToUpdate = (payment.lead_id as string | null) ?? leadId;
  const { error: leadError } = await supabase
    .from("leads")
    .update({ status: "deposit_paid", updated_at: new Date().toISOString() })
    .eq("id", leadIdToUpdate)
    .neq("status", "deposit_paid");

  if (leadError) {
    log.error("Failed to update lead status", { error: leadError.message, lead_id: leadIdToUpdate });
    return jsonInternalServerError(requestId);
  }

  log.info("Webhook processed: payment succeeded, lead deposit_paid", {
    lead_id: leadIdToUpdate,
    payment_id: payment.id,
    session_id: sessionId,
  });
  return NextResponse.json({ received: true, request_id: requestId });
}
