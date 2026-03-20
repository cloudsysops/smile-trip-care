/**
 * POST /api/signup — Create profile for current user (patient only).
 * Call after Supabase auth signUp. No public signup for admin/coordinator/provider/specialist.
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { ensurePatientProfileForUser } from "@/lib/services/profile.service";
import { checkRateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/http/response";

const BodySchema = z.object({
  full_name: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const user = await getCurrentUser();
  if (!user?.email) {
    return jsonError(401, "Unauthorized", requestId);
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!(await checkRateLimit(ip))) {
    log.warn("Signup rate limit exceeded", { ip, user_id: user.id });
    return jsonError(429, "Too many requests. Please try again later.", requestId);
  }
  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  const full_name = parsed.success ? parsed.data.full_name ?? null : null;

  try {
    const result = await ensurePatientProfileForUser(user, full_name, log);
    if (!result.created) {
      return NextResponse.json({ ok: true, message: "Profile already exists" });
    }
  } catch {
    return jsonError(500, "Could not create profile. Contact support.", requestId);
  }
  return NextResponse.json({ ok: true });
}
