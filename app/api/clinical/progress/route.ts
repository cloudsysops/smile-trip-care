/**
 * GET: list treatment progress (role-scoped).
 * POST: create treatment progress (specialist only; patient_id resolved from lead_id).
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  getProgressForPatient,
  getProgressForSpecialist,
  getProgressForAdmin,
  createProgress,
  resolvePatientIdFromLead,
  specialistHasConsultationForLead,
} from "@/lib/clinical/progress";
import { getOrderedStageKeys } from "@/lib/clinical/stages";

const STAGE_KEYS = getOrderedStageKeys();

export async function GET() {
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile } = ctx;

    if (profile.role === "patient" || profile.role === "user") {
      const list = await getProgressForPatient(profile.id);
      return NextResponse.json({ data: list });
    }
    if (profile.role === "specialist") {
      const specialistId = profile.specialist_id;
      if (!specialistId) {
        return NextResponse.json({ data: [] });
      }
      const list = await getProgressForSpecialist(specialistId);
      return NextResponse.json({ data: list });
    }
    if (profile.role === "admin") {
      const list = await getProgressForAdmin();
      return NextResponse.json({ data: list });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const createBodySchema = {
  lead_id: (v: unknown): v is string => typeof v === "string" && v.length > 0,
  stage_key: (v: unknown): v is string =>
    typeof v === "string" && STAGE_KEYS.includes(v as (typeof STAGE_KEYS)[number]),
  notes: (v: unknown) => v == null || typeof v === "string",
  booking_id: (v: unknown) => v == null || typeof v === "string",
};

export async function POST(request: Request) {
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile } = ctx;

    if (profile.role !== "specialist") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const specialistId = profile.specialist_id;
    if (!specialistId) {
      return NextResponse.json(
        { error: "Your account is not linked to a specialist" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const lead_id = body.lead_id as unknown;
    const stage_key = body.stage_key as unknown;
    const notes = body.notes as unknown;
    const booking_id = body.booking_id as unknown;

    if (!createBodySchema.lead_id(lead_id) || !createBodySchema.stage_key(stage_key)) {
      return NextResponse.json(
        { error: "Missing or invalid lead_id or stage_key" },
        { status: 400 }
      );
    }
    if (!createBodySchema.notes(notes) || !createBodySchema.booking_id(booking_id)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const patient_id = await resolvePatientIdFromLead(lead_id);
    if (!patient_id) {
      return NextResponse.json(
        {
          error:
            "No patient account found for this lead. The patient must sign up with the same email to see progress.",
        },
        { status: 400 }
      );
    }

    const allowed = await specialistHasConsultationForLead(specialistId, lead_id);
    if (!allowed) {
      return NextResponse.json(
        { error: "You do not have a consultation for this lead" },
        { status: 403 }
      );
    }

    const row = await createProgress({
      patient_id,
      specialist_id: specialistId,
      lead_id,
      booking_id: booking_id ?? null,
      stage_key,
      notes: notes ?? null,
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
