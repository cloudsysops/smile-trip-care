import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { jsonForbidden, jsonInternalServerError } from "@/lib/http/response";

export async function GET() {
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
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, status, created_at, last_contacted_at, next_follow_up_at")
      .order("created_at", { ascending: false });
    if (error) {
      log.error("Failed to list leads", { error: error.message });
      return jsonInternalServerError(requestId);
    }
    log.info("Admin leads listed", { admin_user_id: adminUserId, count: data?.length ?? 0 });
    return NextResponse.json(data ?? []);
  } catch (err) {
    log.error("Admin leads GET endpoint failed", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}
