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
import { jsonBadRequest, jsonError, jsonForbidden } from "@/lib/http/response";

const STAGE_KEYS = getOrderedStageKeys();

export async function GET() {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return jsonError(401, "Unauthorized", requestId);
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

    return jsonForbidden(requestId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return jsonError(500, message, requestId);
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
  const requestId = crypto.randomUUID();
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return jsonError(401, "Unauthorized", requestId);
    }
    const { profile } = ctx;

    if (profile.role !== "specialist") {
      return jsonForbidden(requestId);
    }
    const specialistId = profile.specialist_id;
    if (!specialistId) {
      return jsonError(403, "Your account is not linked to a specialist", requestId);
    }

    const body = await request.json();
    const lead_id = body.lead_id as unknown;
    const stage_key = body.stage_key as unknown;
    const notes = body.notes as unknown;
    const booking_id = body.booking_id as unknown;

    if (!createBodySchema.lead_id(lead_id) || !createBodySchema.stage_key(stage_key)) {
      return jsonBadRequest("Missing or invalid lead_id or stage_key", requestId);
    }
    if (!createBodySchema.notes(notes) || !createBodySchema.booking_id(booking_id)) {
      return jsonBadRequest("Invalid body", requestId);
    }

    const patient_id = await resolvePatientIdFromLead(lead_id);
    if (!patient_id) {
      return jsonBadRequest(
        "No patient account found for this lead. The patient must sign up with the same email to see progress.",
        requestId,
      );
    }

    const allowed = await specialistHasConsultationForLead(specialistId, lead_id);
    if (!allowed) {
      return jsonError(403, "You do not have a consultation for this lead", requestId);
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
    return jsonError(500, message, requestId);
  }
}
