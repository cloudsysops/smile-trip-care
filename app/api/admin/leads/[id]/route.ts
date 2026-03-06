import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { RouteIdParamSchema } from "@/lib/validation/common";

const UpdateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "deposit_paid", "completed", "cancelled"]),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
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
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status")
      .single();
    if (error) {
      log.error("Failed to update lead", { id, error: error.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin lead PATCH endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
