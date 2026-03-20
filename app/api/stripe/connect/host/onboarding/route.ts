import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import { createHostOnboardingLink } from "@/lib/services/stripe-connect.service";

export async function POST(request: Request) {
  const ctx = await getCurrentProfile();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = await getHostByProfileId(ctx.profile.id);
  if (!host) {
    return NextResponse.json({ error: "No host profile" }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/host`;
  const refreshUrl = `${origin}/host`;

  const url = await createHostOnboardingLink(host.id, returnUrl, refreshUrl);
  return NextResponse.json({ ok: true, url });
}

