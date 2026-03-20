import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { RouteIdParamSchema } from "@/lib/validation/common";

const UpdateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "deposit_paid", "completed", "cancelled"]).optional(),
  last_contacted_at: z.string().datetime().optional(),
  next_follow_up_at: z.string().datetime().nullable().optional(),
  follow_up_notes: z.string().trim().max(2000).nullable().optional(),
  recommended_package_slug: z.string().trim().max(100).nullable().optional(),
}).refine(
  (value) =>
    value.status !== undefined
    || value.last_contacted_at !== undefined
    || value.next_follow_up_at !== undefined
    || value.follow_up_notes !== undefined
    || value.recommended_package_slug !== undefined,
  { message: "At least one field is required" },
);

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  let actorId: string | null = null;
  try {
    const auth = await requireAdmin();
    actorId = auth.profile.id;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const parsedParams = RouteIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
    }
    const { id } = parsedParams.data;
    const body = await request.json().catch(() => ({}));
    const parsed = UpdateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const updates: Record<string, string | null> = {
      updated_at: now,
      updated_by: actorId,
    };
    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
    }
    if (parsed.data.last_contacted_at !== undefined) {
      updates.last_contacted_at = parsed.data.last_contacted_at;
    }
    if (parsed.data.next_follow_up_at !== undefined) {
      updates.next_follow_up_at = parsed.data.next_follow_up_at;
    }
    if (parsed.data.follow_up_notes !== undefined) {
      updates.follow_up_notes = parsed.data.follow_up_notes;
    }
    if (parsed.data.recommended_package_slug !== undefined) {
      updates.recommended_package_slug = parsed.data.recommended_package_slug;
      updates.recommended_package_id = null;
    }
    const supabase = getServerSupabase();
    if (parsed.data.recommended_package_slug !== undefined && parsed.data.recommended_package_slug) {
      const { data: pkg } = await supabase
        .from("packages")
        .select("id")
        .eq("slug", parsed.data.recommended_package_slug)
        .maybeSingle();
      if (pkg?.id) {
        updates.recommended_package_id = pkg.id;
      }
    }
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select("id, status, last_contacted_at, next_follow_up_at, follow_up_notes, recommended_package_slug, recommended_package_id, updated_at, updated_by")
      .single();
    if (error) {
      log.error("Failed to update lead", { id, error: error.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    const payload: Record<string, unknown> = { fields: parsed.data };
    const { error: eventError } = await supabase.from("lead_events").insert({
      lead_id: id,
      actor_user_id: actorId,
      event_type: "lead_updated",
      payload,
      created_at: now,
    });
    if (eventError) {
      log.warn("Lead event insert failed (lead updated)", { lead_id: id, error: eventError.message });
    }
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin lead PATCH endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
