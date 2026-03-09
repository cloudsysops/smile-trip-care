import { NextResponse } from "next/server";
import Stripe from "stripe";
import { branding } from "@/lib/branding";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { UuidSchema } from "@/lib/validation/common";

const BodySchema = z.object({
  lead_id: UuidSchema,
  amount_cents: z.number().int().positive().max(10_000_000).optional(),
  success_url: z.string().max(2000).optional(),
  cancel_url: z.string().max(2000).optional(),
});

const FALLBACK_DEPOSIT_CENTS = 50_000;

function resolveInternalReturnUrl(
  rawUrl: string | undefined,
  origin: string,
  fallbackPath: string,
): string | null {
  if (!rawUrl) {
    return `${origin}${fallbackPath}`;
  }
  try {
    const url = new URL(rawUrl, origin);
    if (url.origin !== origin) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const ctx = await getCurrentProfile();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
  }
  const isAdmin = ctx.profile.role === "admin";
  const isPatient = ctx.profile.role === "patient" || ctx.profile.role === "user";
  if (!isAdmin && !isPatient) {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const config = getServerConfig();
    if (!config.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured", request_id: requestId }, { status: 500 });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body: lead_id (UUID) and amount_cents (positive integer) required", request_id: requestId },
        { status: 400 }
      );
    }
    const { lead_id, amount_cents, success_url, cancel_url } = parsed.data;
    const origin = new URL(request.url).origin;
    const defaultSuccess = isAdmin ? `/admin/leads/${lead_id}?paid=1` : `/patient?paid=1`;
    const defaultCancel = isAdmin ? `/admin/leads/${lead_id}` : `/patient`;
    const successUrl = resolveInternalReturnUrl(success_url, origin, defaultSuccess);
    const cancelUrl = resolveInternalReturnUrl(cancel_url, origin, defaultCancel);
    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Invalid return URLs" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: leadRow, error: leadError } = await supabase
      .from("leads")
      .select("id, package_slug, recommended_package_slug, email")
      .eq("id", lead_id)
      .maybeSingle();
    if (leadError) {
      log.error("Failed to validate lead before checkout", { error: leadError.message, lead_id });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    if (!leadRow) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (isPatient && (leadRow.email as string | null)?.trim()?.toLowerCase() !== (ctx.profile.email ?? "").trim().toLowerCase()) {
      return NextResponse.json({ error: "You can only pay deposit for your own lead", request_id: requestId }, { status: 403 });
    }

    let packageName: string | null = null;
    let resolvedAmountCents = FALLBACK_DEPOSIT_CENTS;
    const packageSlug =
      (leadRow.recommended_package_slug as string | null | undefined)
      ?? (leadRow.package_slug as string | null | undefined)
      ?? null;
    if (packageSlug) {
      const { data: packageRow, error: packageError } = await supabase
        .from("packages")
        .select("name, deposit_cents")
        .eq("slug", packageSlug)
        .maybeSingle();
      if (packageError) {
        log.error("Failed to load package pricing", {
          error: packageError.message,
          package_slug: packageSlug,
        });
        return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
      }
      if (packageRow?.name) {
        packageName = packageRow.name as string;
      }
      const packageDepositRaw = packageRow?.deposit_cents;
      const packageDeposit =
        typeof packageDepositRaw === "number"
          ? packageDepositRaw
          : typeof packageDepositRaw === "string"
            ? Number(packageDepositRaw)
            : NaN;
      if (Number.isInteger(packageDeposit) && packageDeposit > 0) {
        resolvedAmountCents = packageDeposit;
      }
    }

    if (amount_cents !== undefined && amount_cents !== resolvedAmountCents) {
      log.warn("Ignoring client-provided amount_cents; server pricing enforced", {
        lead_id,
        client_amount_cents: amount_cents,
        resolved_amount_cents: resolvedAmountCents,
      });
    }

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id, status")
      .eq("id", lead_id)
      .maybeSingle();
    if (leadErr) {
      log.error("Failed to fetch lead", { error: leadErr.message, lead_id });
      return NextResponse.json(
        { error: "Internal server error", request_id: requestId },
        { status: 500 }
      );
    }
    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found", request_id: requestId },
        { status: 400 }
      );
    }
    if (lead.status === "deposit_paid") {
      return NextResponse.json(
        { error: "Deposit already paid for this lead", request_id: requestId },
        { status: 400 }
      );
    }

    const stripe = new Stripe(config.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: resolvedAmountCents,
            product_data: { name: `Deposit — ${packageName ?? branding.productName}` },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { lead_id },
    });

    const { error } = await supabase.from("payments").insert({
      lead_id,
      stripe_checkout_session_id: session.id,
      amount_cents: resolvedAmountCents,
      status: "pending",
    });
    if (error) {
      log.error("Failed to persist checkout session", { error: error.message, lead_id });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, amount_cents: resolvedAmountCents, request_id: requestId });
  } catch (err) {
    log.error("Stripe checkout endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
