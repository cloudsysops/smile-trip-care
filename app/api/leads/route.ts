// Revisado: OK — rate limit (10/min), mensajes de error amigables, contrato 201 + lead_id.
import { NextResponse } from "next/server";
import { LeadCreateSchema } from "@/lib/validation/lead";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLeadFromAssessment } from "@/lib/services/assessment.service";
import { sanitizeTextInput } from "@/lib/security/sanitize";

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
    const sanitizedBody = {
      ...body,
      first_name: sanitizeTextInput(body.first_name, 200),
      last_name: sanitizeTextInput(body.last_name, 200),
      email: sanitizeTextInput(body.email, 320),
      phone: sanitizeTextInput(body.phone, 50),
      country: sanitizeTextInput(body.country, 100),
      package_slug: sanitizeTextInput(body.package_slug, 100),
      message: sanitizeTextInput(body.message, 2000),
      landing_path: sanitizeTextInput(body.landing_path, 1000),
      referrer_url: sanitizeTextInput(body.referrer_url, 2000),
      travel_companions: sanitizeTextInput(body.travel_companions, 200),
      budget_range: sanitizeTextInput(body.budget_range, 200),
      company_website: sanitizeTextInput(body.company_website, 500),
      utm_source: sanitizeTextInput(body.utm_source, 150),
      utm_medium: sanitizeTextInput(body.utm_medium, 150),
      utm_campaign: sanitizeTextInput(body.utm_campaign, 150),
      utm_term: sanitizeTextInput(body.utm_term, 150),
      utm_content: sanitizeTextInput(body.utm_content, 150),
    };
    const parsed = LeadCreateSchema.safeParse(sanitizedBody);
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
