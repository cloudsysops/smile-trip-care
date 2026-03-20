import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getProviderById, updateProvider } from "@/lib/providers";
import { ProviderUpdateSchema } from "@/lib/validation/provider";
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
    const provider = await getProviderById(parsed.data.id);
    if (!provider) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json(provider);
  } catch (err) {
    log.error("Admin provider GET failed", { err: String(err) });
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
    const parsed = ProviderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const { data, error } = await updateProvider(parsedParams.data.id, parsed.data as Record<string, unknown>);
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
    log.error("Admin provider PATCH failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
