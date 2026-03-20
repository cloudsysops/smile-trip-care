import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getSpecialistById, updateSpecialist } from "@/lib/specialists";
import { SpecialistUpdateSchema } from "@/lib/validation/specialist";
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
    const specialist = await getSpecialistById(parsed.data.id);
    if (!specialist) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json(specialist);
  } catch (err) {
    log.error("Admin specialist GET failed", { err: String(err) });
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
    const parsed = SpecialistUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const { data, error } = await updateSpecialist(parsedParams.data.id, parsed.data);
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
    log.error("Admin specialist PATCH failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
