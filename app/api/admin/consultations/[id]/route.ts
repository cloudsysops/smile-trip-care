import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getConsultationById, updateConsultation } from "@/lib/consultations";
import { ConsultationUpdateSchema } from "@/lib/validation/consultation";
import { RouteIdParamSchema } from "@/lib/validation/common";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const parsed = RouteIdParamSchema.safeParse(await params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id", request_id: requestId }, { status: 400 });
    }
    const consultation = await getConsultationById(parsed.data.id);
    if (!consultation) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json(consultation);
  } catch (err) {
    log.error("Admin consultation GET failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const parsedParams = RouteIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid id", request_id: requestId }, { status: 400 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body", request_id: requestId },
        { status: 400 }
      );
    }
    const parsed = ConsultationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const updatePayload: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.scheduled_at instanceof Date) {
      updatePayload.scheduled_at = parsed.data.scheduled_at.toISOString();
    }
    const { data, error } = await updateConsultation(parsedParams.data.id, updatePayload);
    if (error) {
      return NextResponse.json(
        { error: error || "Update failed", request_id: requestId },
        { status: 422 }
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin consultation PATCH failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
