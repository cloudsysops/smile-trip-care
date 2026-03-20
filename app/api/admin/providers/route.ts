import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getProviders, createProvider } from "@/lib/providers";
import { ProviderCreateSchema } from "@/lib/validation/provider";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const data = await getProviders();
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin providers GET failed", { err: String(err) });
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
    const parsed = ProviderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const slug = payload.slug ?? payload.name.toLowerCase().replaceAll(/\s+/g, "-").replaceAll(/[^a-z0-9-]/g, "");
    const { data, error } = await createProvider({
      name: payload.name,
      slug: slug || undefined,
      provider_type: payload.provider_type ?? undefined,
      city: payload.city,
      country: payload.country ?? "Colombia",
      description: payload.description ?? null,
      contact_email: payload.contact_email ?? null,
      contact_phone: payload.contact_phone ?? null,
      website: payload.website ?? null,
      invited_by_provider_id: payload.invited_by_provider_id ?? null,
      is_family_network: payload.is_family_network ?? false,
      internal_notes: payload.internal_notes ?? null,
      verified: payload.verified ?? false,
      published: payload.published ?? false,
      approval_status: payload.approval_status ?? "pending",
      type: (payload.provider_type ?? "clinic") as "clinic" | "tour_operator" | "specialist",
    });
    if (error) {
      log.warn("Provider create failed", { error });
      return NextResponse.json(
        { error: error.length > 0 ? error : "Create failed", request_id: requestId },
        { status: 422 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    log.error("Admin providers POST failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
