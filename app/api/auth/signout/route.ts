import { type NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { jsonInternalServerError } from "@/lib/http/response";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  try {
    const supabase = await getAuthClient();
    await supabase.auth.signOut();
    log.info("Admin signed out");
    const url = new URL("/admin/login", request.nextUrl.origin);
    return NextResponse.redirect(url, { status: 302 });
  } catch (err) {
    log.error("Signout endpoint failed", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}
