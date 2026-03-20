import { NextResponse } from "next/server";
import { requireSpecialist } from "@/lib/auth";
import { createSpecialistOnboardingLink } from "@/lib/services/stripe-connect.service";

export async function POST(request: Request) {
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!profile.specialist_id) {
    return NextResponse.json({ error: "No specialist profile" }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/specialist`;
  const refreshUrl = `${origin}/specialist`;

  try {
    const url = await createSpecialistOnboardingLink(profile.specialist_id, returnUrl, refreshUrl);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ error: "Failed to create onboarding link" }, { status: 500 });
  }
}

