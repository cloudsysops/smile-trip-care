import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, status, created_at, last_contacted_at, next_follow_up_at")
      .order("created_at", { ascending: false });
    if (error) {
      log.error("Failed to list leads", { error: error.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch (err) {
    log.error("Admin leads GET endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
