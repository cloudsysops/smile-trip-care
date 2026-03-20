import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getAllSpecialists, createSpecialist } from "@/lib/specialists";
import { SpecialistCreateSchema } from "@/lib/validation/specialist";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const data = await getAllSpecialists();
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin specialists GET failed", { err: String(err) });
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
    const parsed = SpecialistCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const slug = payload.slug ?? payload.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data, error } = await createSpecialist({
      name: payload.name,
      slug: slug || undefined,
      specialty: payload.specialty,
      city: payload.city,
      clinic_name: payload.clinic_name ?? null,
      bio: payload.bio ?? null,
      photo_asset_id: payload.photo_asset_id ?? null,
      free_evaluation: payload.free_evaluation ?? true,
      provider_id: payload.provider_id ?? null,
      recommended_by_provider_id: payload.recommended_by_provider_id ?? null,
      approval_status: payload.approval_status ?? "pending",
      published: payload.published ?? false,
      description: payload.bio ?? null,
      clinic: payload.clinic_name ?? null,
      sort_order: 0,
    });
    if (error) {
      log.warn("Specialist create failed", { error });
      return NextResponse.json(
        { error: error || "Create failed", request_id: requestId },
        { status: 422 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    log.error("Admin specialists POST failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
