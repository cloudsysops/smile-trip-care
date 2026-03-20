import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { jsonBadRequest, jsonError } from "@/lib/http/response";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    await requireAdmin();
  } catch {
    return jsonError(403, "Forbidden", requestId);
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim() ?? "";
  if (email.length < 3) {
    return jsonBadRequest("Email query must be at least 3 characters", requestId);
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, provider_id, specialist_id")
    .ilike("email", `%${email}%`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return jsonError(500, "Failed to search profiles", requestId);
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}

