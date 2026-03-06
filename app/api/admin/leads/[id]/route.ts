import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { RouteIdParamSchema } from "@/lib/validation/common";
import { jsonBadRequest, jsonForbidden, jsonInternalServerError } from "@/lib/http/response";

const UpdateLeadSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "deposit_paid", "completed", "cancelled"]),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  let adminUserId = "";
  try {
    const { user } = await requireAdmin();
    adminUserId = user.id;
  } catch {
    return jsonForbidden(requestId);
  }
  try {
    const parsedParams = RouteIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonBadRequest("Invalid lead id", requestId);
    }
    const { id } = parsedParams.data;
    const body = await request.json().catch(() => ({}));
    const parsed = UpdateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return jsonBadRequest("Invalid body", requestId);
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
      return jsonInternalServerError(requestId);
    }
    log.info("Admin lead status updated", { admin_user_id: adminUserId, lead_id: id, status: parsed.data.status });
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin lead PATCH endpoint failed", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}
