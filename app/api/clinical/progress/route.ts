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
import { parseProgressCreateBody } from "@/lib/services/clinical/progress-policy.service";

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
    const parsedCreate = parseProgressCreateBody(body as Record<string, unknown>, STAGE_KEYS);
    if (parsedCreate.error) {
      return jsonBadRequest(parsedCreate.error, requestId);
    }
    const lead_id = parsedCreate.lead_id!;
    const stage_key = parsedCreate.stage_key!;
    const notes = parsedCreate.notes ?? null;
    const booking_id = parsedCreate.booking_id ?? null;

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
      booking_id,
      stage_key,
      notes,
    });
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return jsonError(500, message, requestId);
  }
}
