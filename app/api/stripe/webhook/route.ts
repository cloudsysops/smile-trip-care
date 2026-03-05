import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";

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
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(
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
  const leadId = session.metadata?.lead_id as string | undefined;
  if (!leadId) {
    log.warn("checkout.session.completed without lead_id in metadata");
    return NextResponse.json({ received: true });
  }
  const supabase = getServerSupabase();
  const { data: payment, error: updatePayError } = await supabase
    .from("payments")
    .update({ status: "succeeded", updated_at: new Date().toISOString() })
    .eq("stripe_checkout_session_id", sessionId)
    .select("id")
    .single();
  if (updatePayError || !payment) {
    log.error("Failed to update payment", { error: String(updatePayError) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
  const { error: leadError } = await supabase
    .from("leads")
    .update({ status: "deposit_paid", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (leadError) {
    log.error("Failed to update lead status", { error: leadError.message });
  }
  log.info("Webhook processed: payment succeeded, lead deposit_paid", { lead_id: leadId, payment_id: payment.id });
  return NextResponse.json({ received: true });
}
