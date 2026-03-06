import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";

const QuerySchema = z.object({
  status: z.enum(["approved", "queued", "failed"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsedQuery = QuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: "Invalid query", request_id: requestId }, { status: 400 });
  }

  const statuses = parsedQuery.data.status
    ? [parsedQuery.data.status]
    : ["approved", "queued", "failed"];
  const limit = parsedQuery.data.limit ?? 100;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("outbound_messages")
    .select("id, lead_id, source, channel, status, subject, body_text, attempts, max_attempts, scheduled_for, failure_reason, created_at, leads!inner(id, first_name, last_name, email, status)")
    .in("status", statuses)
    .order("scheduled_for", { ascending: true })
    .limit(limit);
  if (error) {
    log.error("Failed to load outbound action queue", { error: error.message });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  return NextResponse.json({ queue: data ?? [], request_id: requestId });
}
