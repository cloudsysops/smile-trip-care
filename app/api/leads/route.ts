// Revisado: OK — rate limit (10/min), mensajes de error amigables, contrato 201 + lead_id.
import { NextResponse } from "next/server";
import { LeadCreateSchema } from "@/lib/validation/lead";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLeadFromAssessment } from "@/lib/services/assessment.service";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  log.info("POST /api/leads hit", { requestId });
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body", request_id: requestId },
        { status: 400 }
      );
    }
    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      log.warn("Lead validation failed", { errors: parsed.error.flatten() });
      return NextResponse.json(
        { error: "Validation failed. Check your name, email, and other fields.", request_id: requestId },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if ((data.company_website ?? "").trim().length > 0) {
      log.info("Honeypot filled; returning 200 without inserting");
      return NextResponse.json({ ok: true, request_id: requestId }, { status: 200 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    if (!(await checkRateLimit(ip))) {
      log.warn("Rate limit exceeded", { ip });
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", request_id: requestId },
        { status: 429 }
      );
    }

    const { leadId, recommendedPackageSlug } = await createLeadFromAssessment(data, {
      requestId,
      requestUrl: request.url,
      log,
    });
    return NextResponse.json(
      {
        lead_id: leadId,
        recommended_package_slug: recommendedPackageSlug ?? undefined,
        request_id: requestId,
      },
      { status: 201 }
    );
  } catch (err) {
    log.error("Leads API error", { err: String(err) });
    return NextResponse.json(
      { error: "Server error", request_id: requestId },
      { status: 500 }
    );
  }
}
