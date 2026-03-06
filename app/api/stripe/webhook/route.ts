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

export const runtime = "nodejs";

/** Stripe webhook: MUST use raw body for signature verification. */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfig();
  if (!config.STRIPE_WEBHOOK_SECRET) {
    log.error("Stripe webhook env missing");
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    log.warn("Webhook missing stripe-signature");
    return NextResponse.json({ error: "Missing signature", request_id: requestId }, { status: 400 });
  }
  let payload: string;
  try {
    payload = await request.text();
  } catch {
    log.error("Failed to read raw body");
    return NextResponse.json({ error: "Bad body", request_id: requestId }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid signature", request_id: requestId }, { status: 400 });
  }
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const metadataParsed = CheckoutSessionMetadataSchema.safeParse(session.metadata ?? {});
  if (!metadataParsed.success) {
    log.warn("checkout.session.completed with invalid lead_id metadata");
    return NextResponse.json({ received: true });
  }
  const { lead_id: leadId } = metadataParsed.data;
  const supabase = getServerSupabase();
  const { data: paymentRows, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id, lead_id, status")
    .eq("stripe_checkout_session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(2);
  if (paymentLookupError) {
    log.error("Failed to lookup payment by session", { error: paymentLookupError.message });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  let paymentId: string;
  let leadIdToUpdate: string = leadId;
  if (!paymentRows || paymentRows.length === 0) {
    log.warn("No payment row found for session; creating succeeded payment from webhook", { session_id: sessionId });
    const { data: createdPayment, error: createPaymentError } = await supabase
      .from("payments")
      .insert({
        lead_id: leadId,
        stripe_checkout_session_id: sessionId,
        amount_cents: session.amount_total ?? null,
        status: "succeeded",
      })
      .select("id, lead_id")
      .single();
    if (createPaymentError || !createdPayment) {
      log.error("Failed to create payment from webhook", { error: String(createPaymentError) });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    paymentId = createdPayment.id as string;
    leadIdToUpdate = createdPayment.lead_id as string;
  } else {
    if (paymentRows.length > 1) {
      log.warn("Multiple payments found for Stripe session; using latest row", {
        session_id: sessionId,
        count: paymentRows.length,
      });
    }
    const latestPayment = paymentRows[0];
    paymentId = latestPayment.id as string;
    if (typeof latestPayment.lead_id === "string" && latestPayment.lead_id.length > 0) {
      leadIdToUpdate = latestPayment.lead_id;
    }
    if (latestPayment.status !== "succeeded") {
      const { error: updatePayError } = await supabase
        .from("payments")
        .update({ status: "succeeded", updated_at: new Date().toISOString() })
        .eq("id", paymentId);
      if (updatePayError) {
        log.error("Failed to update payment", { payment_id: paymentId, error: updatePayError.message });
        return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
      }
    }
  }

  if (leadIdToUpdate !== leadId) {
    log.warn("Lead id mismatch between metadata and payment row", {
      metadata_lead_id: leadId,
      payment_lead_id: leadIdToUpdate,
      payment_id: paymentId,
    });
  }

  const { error: leadError } = await supabase
    .from("leads")
    .update({ status: "deposit_paid", updated_at: new Date().toISOString() })
    .eq("id", leadIdToUpdate);
  if (leadError) {
    log.error("Failed to update lead status", { error: leadError.message });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
  log.info("Webhook processed: payment succeeded, lead deposit_paid", { lead_id: leadIdToUpdate, payment_id: paymentId });
  return NextResponse.json({ received: true });
}
