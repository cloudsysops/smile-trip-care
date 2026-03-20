import { NextResponse } from "next/server";
import { requireSpecialist } from "@/lib/auth";
import { getAvailabilitySlotsForSpecialist, replaceAvailabilityForSpecialist } from "@/lib/services/specialist-availability.service";
import { AvailabilityPatchBodySchema } from "@/lib/validation/specialist-availability";
import { jsonError } from "@/lib/http/response";

export async function GET() {
  const requestId = crypto.randomUUID();
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    return jsonError(401, "Unauthorized", requestId);
  }
  const specialistId = profile.specialist_id;
  if (!specialistId) {
    return jsonError(403, "No specialist linked to profile", requestId);
  }

  const slots = await getAvailabilitySlotsForSpecialist(specialistId);
  return NextResponse.json({ slots });
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID();
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    return jsonError(401, "Unauthorized", requestId);
  }
  const specialistId = profile.specialist_id;
  if (!specialistId) {
    return jsonError(403, "No specialist linked to profile", requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON body", requestId);
  }

  const parsed = AvailabilityPatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten(), requestId }, { status: 400 });
  }

  const days = new Set(parsed.data.slots.map((s) => s.day_of_week));
  if (days.size !== parsed.data.slots.length) {
    return jsonError(400, "Duplicate day_of_week in payload", requestId);
  }

  const { error } = await replaceAvailabilityForSpecialist(specialistId, parsed.data.slots);
  if (error) {
    return NextResponse.json({ error: "Failed to save availability", details: error, requestId }, { status: 500 });
  }

  const slots = await getAvailabilitySlotsForSpecialist(specialistId);
  return NextResponse.json({ ok: true, slots });
}
