import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { UuidSchema } from "@/lib/validation/common";

const CheckoutSessionMetadataSchema = z.object({
  lead_id: UuidSchema,
});

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2026-02-25.clover";

/** Stripe webhook: MUST use raw body for signature verification. */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfig();
  if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
    log.error("Stripe webhook env missing");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    log.warn("Webhook missing stripe-signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  let payload: string;
  try {
    payload = await request.text();
  } catch {
    log.error("Failed to read raw body");
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }
  const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    log.warn("Webhook signature verification failed", { err: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const metadataParsed = CheckoutSessionMetadataSchema.safeParse(session.metadata ?? {});
  if (!metadataParsed.success) {
    log.warn("checkout.session.completed with invalid lead_id metadata");
  }
  const leadId = metadataParsed.success ? metadataParsed.data.lead_id : undefined;
  const supabase = getServerSupabase();
  const { data: existingPayment, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id, lead_id, status")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  if (paymentLookupError) {
    log.error("Failed to lookup payment", { error: paymentLookupError.message, session_id: sessionId });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
  if (!existingPayment) {
    log.warn("Webhook received for unknown checkout session", { session_id: sessionId });
    return NextResponse.json({ received: true });
  }
  if (existingPayment.status === "succeeded") {
    log.info("Webhook replay ignored: payment already succeeded", {
      payment_id: existingPayment.id,
      session_id: sessionId,
    });
    return NextResponse.json({ received: true, idempotent: true });
  }
  const now = new Date().toISOString();
  const { data: payment, error: updatePayError } = await supabase
    .from("payments")
    .update({ status: "succeeded", updated_at: now })
    .eq("id", existingPayment.id)
    .neq("status", "succeeded")
    .select("id")
    .maybeSingle();
  if (updatePayError || !payment) {
    if (!updatePayError && !payment) {
      log.info("Webhook replay ignored after concurrent update", { payment_id: existingPayment.id });
      return NextResponse.json({ received: true, idempotent: true });
    }
    log.error("Failed to update payment", { error: String(updatePayError) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
  const leadIdToUpdate = leadId ?? existingPayment.lead_id;
  if (!leadIdToUpdate) {
    log.warn("No lead id available for succeeded payment", { payment_id: payment.id });
    return NextResponse.json({ received: true });
  }
  const { error: leadError } = await supabase
    .from("leads")
    .update({ status: "deposit_paid", updated_at: now })
    .eq("id", leadIdToUpdate)
    .neq("status", "deposit_paid");
  if (leadError) {
    log.error("Failed to update lead status", { error: leadError.message });
  }
  log.info("Webhook processed: payment succeeded, lead deposit_paid", {
    lead_id: leadIdToUpdate,
    payment_id: payment.id,
  });
  return NextResponse.json({ received: true });
}
