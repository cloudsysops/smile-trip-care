import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import { createHostOnboardingLink } from "@/lib/services/stripe-connect.service";
import { jsonError } from "@/lib/http/response";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const ctx = await getCurrentProfile();
  if (!ctx) {
    return jsonError(401, "Unauthorized", requestId);
  }

  const host = await getHostByProfileId(ctx.profile.id);
  if (!host) {
    return jsonError(403, "No host profile", requestId);
  }

  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/host`;
  const refreshUrl = `${origin}/host`;

  const url = await createHostOnboardingLink(host.id, returnUrl, refreshUrl);
  return NextResponse.json({ ok: true, url });
}

