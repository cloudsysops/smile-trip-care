import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getAllExperiences, createExperience } from "@/lib/experiences";
import { ExperienceCreateSchema } from "@/lib/validation/experience";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const data = await getAllExperiences();
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin experiences GET failed", { err: String(err) });
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
    const parsed = ExperienceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const payload = parsed.data;
    const slug = payload.slug ?? payload.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data, error } = await createExperience({
      name: payload.name,
      slug: slug || undefined,
      city: payload.city,
      category: payload.category ?? "other",
      description: payload.description ?? null,
      duration_hours: payload.duration_hours ?? null,
      price_cents: null,
      price_usd: payload.price_usd ?? null,
      includes: payload.includes?.length ? payload.includes : null,
      provider_id: payload.provider_id ?? null,
      published: payload.published ?? false,
      sort_order: 0,
    });
    if (error) {
      log.warn("Experience create failed", { error });
      return NextResponse.json(
        { error: error || "Create failed", request_id: requestId },
        { status: 422 }
      );
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    log.error("Admin experiences POST failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
