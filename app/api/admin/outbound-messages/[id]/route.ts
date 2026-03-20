import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { RouteIdParamSchema } from "@/lib/validation/common";
import { canTransitionOutboundStatus, OUTBOUND_STATUSES } from "@/lib/outbound/messages";

type Props = { params: Promise<{ id: string }> };

const UpdateOutboundSchema = z.object({
  status: z.enum(OUTBOUND_STATUSES),
  failure_reason: z.string().trim().max(800).optional(),
  provider: z.string().trim().max(120).optional(),
  provider_message_id: z.string().trim().max(240).optional(),
}).superRefine((value, ctx) => {
  if (value.status === "failed" && (!value.failure_reason || value.failure_reason.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["failure_reason"],
      message: "failure_reason is required when status is failed",
    });
  }
});

const SELECT_COLUMNS = [
  "id",
  "lead_id",
  "source",
  "channel",
  "status",
  "subject",
  "body_text",
  "provider",
  "provider_message_id",
  "attempts",
  "max_attempts",
  "scheduled_for",
  "sent_at",
  "delivered_at",
  "replied_at",
  "failure_reason",
  "created_by",
  "approved_by",
  "created_at",
  "updated_at",
].join(", ");

export async function PATCH(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  let userId = "";
  try {
    const auth = await requireAdmin();
    userId = auth.user.id;
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  const parsedParams = RouteIdParamSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid outbound message id", request_id: requestId }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const parsedBody = UpdateOutboundSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data: row, error: rowError } = await supabase
    .from("outbound_messages")
    .select("id, lead_id, status, attempts")
    .eq("id", parsedParams.data.id)
    .maybeSingle();
  if (rowError) {
    log.error("Failed to load outbound message", {
      outbound_id: parsedParams.data.id,
      error: rowError.message,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Outbound message not found", request_id: requestId }, { status: 404 });
  }

  const currentStatus = row.status as (typeof OUTBOUND_STATUSES)[number];
  const nextStatus = parsedBody.data.status;
  if (!canTransitionOutboundStatus(currentStatus, nextStatus)) {
    return NextResponse.json({
      error: "Invalid status transition",
      request_id: requestId,
    }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, string | number | null> = {
    status: nextStatus,
    updated_at: now,
  };
  if (parsedBody.data.provider) patch.provider = parsedBody.data.provider;
  if (parsedBody.data.provider_message_id) patch.provider_message_id = parsedBody.data.provider_message_id;
  if (nextStatus === "approved") patch.approved_by = userId;
  if (nextStatus === "queued") {
    patch.attempts = Number(row.attempts ?? 0) + 1;
    patch.failure_reason = null;
    patch.scheduled_for = now;
  }
  if (nextStatus === "sent") {
    patch.sent_at = now;
    patch.failure_reason = null;
  }
  if (nextStatus === "delivered") patch.delivered_at = now;
  if (nextStatus === "replied") patch.replied_at = now;
  if (nextStatus === "failed") patch.failure_reason = parsedBody.data.failure_reason ?? "Unknown failure";

  const { data: updated, error: updateError } = await supabase
    .from("outbound_messages")
    .update(patch)
    .eq("id", parsedParams.data.id)
    .select(SELECT_COLUMNS)
    .single();
  if (updateError) {
    log.error("Failed to update outbound message", {
      outbound_id: parsedParams.data.id,
      error: updateError.message,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  if (nextStatus === "sent" || nextStatus === "delivered" || nextStatus === "replied") {
    const leadPatch: Record<string, string> = {
      last_contacted_at: now,
      updated_at: now,
    };
    const { error: leadUpdateError } = await supabase
      .from("leads")
      .update(leadPatch)
      .eq("id", row.lead_id as string);
    if (leadUpdateError) {
      log.warn("Failed to update lead last_contacted_at after outbound status", {
        lead_id: row.lead_id,
        outbound_id: parsedParams.data.id,
        error: leadUpdateError.message,
      });
    }
  }

  log.info("Outbound message status updated", {
    outbound_id: parsedParams.data.id,
    lead_id: row.lead_id,
    from_status: currentStatus,
    to_status: nextStatus,
  });
  return NextResponse.json({ message: updated, request_id: requestId });
}
