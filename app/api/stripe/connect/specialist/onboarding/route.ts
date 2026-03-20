import { NextResponse } from "next/server";
import { requireSpecialist } from "@/lib/auth";
import { createSpecialistOnboardingLink } from "@/lib/services/stripe-connect.service";
import { jsonError } from "@/lib/http/response";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    return jsonError(401, "Unauthorized", requestId);
  }

  if (!profile.specialist_id) {
    return jsonError(403, "No specialist profile", requestId);
  }

  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/specialist`;
  const refreshUrl = `${origin}/specialist`;

  try {
    const url = await createSpecialistOnboardingLink(profile.specialist_id, returnUrl, refreshUrl);
    return NextResponse.json({ ok: true, url });
  } catch {
    return jsonError(500, "Failed to create onboarding link", requestId);
  }
}

