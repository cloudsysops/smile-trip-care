import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireHost } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import { createLogger } from "@/lib/logger";

const PatchSchema = z.object({
  is_active: z.boolean(),
});

type RouteContext = Readonly<{ params: Promise<{ id: string }> }>;

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requireHost();
    const host = await getHostByProfileId(profile.id);
    if (!host) {
      return NextResponse.json({ error: "Host profile not found", request_id: requestId }, { status: 404 });
    }
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const supabase = getServerSupabase();
    const { data: row, error: fetchErr } = await supabase
      .from("services")
      .select("id, host_id")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr || !row || row.host_id !== host.id) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    const { error } = await supabase.from("services").update({ is_active: parsed.data.is_active }).eq("id", id);
    if (error) {
      log.error("host service patch failed", { error: error.message });
      return NextResponse.json({ error: "Failed to update", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json({ ok: true, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("PATCH /api/host/services/[id] failed", { error: msg });
    return NextResponse.json({ error: "Failed to update", request_id: requestId }, { status: 500 });
  }
}
