import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { RouteIdParamSchema } from "@/lib/validation/common";
import { OUTBOUND_CHANNELS, OUTBOUND_SOURCES } from "@/lib/outbound/messages";

type Props = { params: Promise<{ id: string }> };

const CreateOutboundSchema = z.object({
  source: z.enum(OUTBOUND_SOURCES).optional(),
  channel: z.enum(OUTBOUND_CHANNELS),
  subject: z.string().trim().max(240).nullable().optional(),
  body_text: z.string().trim().min(1).max(6000),
  status: z.enum(["draft", "approved"]).optional(),
  scheduled_for: z.string().datetime().optional(),
}).superRefine((value, ctx) => {
  if (value.channel === "email" && (!value.subject || value.subject.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subject"],
      message: "Subject is required for email messages",
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

export async function GET(_: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  const parsedParams = RouteIdParamSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Invalid lead id", request_id: requestId }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("outbound_messages")
    .select(SELECT_COLUMNS)
    .eq("lead_id", parsedParams.data.id)
    .order("created_at", { ascending: false });
  if (error) {
    log.error("Failed to list outbound messages", {
      lead_id: parsedParams.data.id,
      error: error.message,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [], request_id: requestId });
}

export async function POST(request: Request, { params }: Props) {
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
    return NextResponse.json({ error: "Invalid lead id", request_id: requestId }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const parsedBody = CreateOutboundSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", parsedParams.data.id)
    .maybeSingle();
  if (leadError) {
    log.error("Failed to verify lead before outbound insert", {
      lead_id: parsedParams.data.id,
      error: leadError.message,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
  if (!lead) {
    return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
  }

  const now = new Date().toISOString();
  const status = parsedBody.data.status ?? "draft";
  const insertRow = {
    lead_id: parsedParams.data.id,
    source: parsedBody.data.source ?? "manual",
    channel: parsedBody.data.channel,
    status,
    subject: parsedBody.data.subject ?? null,
    body_text: parsedBody.data.body_text,
    scheduled_for: parsedBody.data.scheduled_for ?? now,
    created_by: userId,
    approved_by: status === "approved" ? userId : null,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("outbound_messages")
    .insert(insertRow)
    .select(SELECT_COLUMNS)
    .single();
  if (error) {
    log.error("Failed to create outbound message", {
      lead_id: parsedParams.data.id,
      error: error.message,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  const inserted = data as unknown as {
    id?: string;
    channel?: string;
    status?: string;
  };
  log.info("Outbound draft created", {
    lead_id: parsedParams.data.id,
    outbound_id: inserted.id,
    channel: inserted.channel,
    status: inserted.status,
  });
  return NextResponse.json({ message: data, request_id: requestId });
}
