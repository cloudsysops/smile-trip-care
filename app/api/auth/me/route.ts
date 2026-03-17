import { NextResponse } from "next/server";
import { getCurrentProfile, getRedirectPathForRole } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

/**
 * GET /api/auth/me — Returns current user role and redirect path for post-login.
 * Use after signIn to redirect by role. Returns 401 if not authenticated or inactive.
 */
export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const ctx = await getCurrentProfile();
  if (!ctx) {
    log.info("auth/me: 401 (no session or no active profile)", { request_id: requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  log.info("auth/me: 200", { role: ctx.profile.role, request_id: requestId });
  return NextResponse.json({
    role: ctx.profile.role,
    redirectPath: getRedirectPathForRole(ctx.profile.role),
    email: ctx.profile.email,
    full_name: ctx.profile.full_name,
  });
}
