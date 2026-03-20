import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getConsultations, createConsultation } from "@/lib/consultations";
import { ConsultationCreateSchema } from "@/lib/validation/consultation";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const data = await getConsultations();
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin consultations GET failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body", request_id: requestId },
        { status: 400 }
      );
    }
    const parsed = ConsultationCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const scheduledAt =
      payload.scheduled_at != null
        ? payload.scheduled_at instanceof Date
          ? payload.scheduled_at.toISOString()
          : String(payload.scheduled_at)
        : null;
    const { data, error } = await createConsultation({
      lead_id: payload.lead_id,
      specialist_id: payload.specialist_id,
      status: payload.status ?? "requested",
      scheduled_at: scheduledAt,
      scheduled_date: payload.scheduled_date ?? null,
      scheduled_time: payload.scheduled_time ?? null,
      notes: payload.notes ?? null,
    });
    if (error) {
      log.warn("Consultation create failed", { error });
      return NextResponse.json(
        { error: error || "Create failed", request_id: requestId },
        { status: 422 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    log.error("Admin consultations POST failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
