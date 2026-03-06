import { NextResponse } from "next/server";
import { LeadCreateSchema } from "@/lib/validation/lead";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid input", request_id: requestId },
        { status: 400 }
      );
    }
    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      log.warn("Lead validation failed", { errors: parsed.error.flatten() });
      return NextResponse.json(
        { error: "Invalid input", request_id: requestId },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if ((data.company_website ?? "").trim().length > 0) {
      log.info("Honeypot filled; returning 200 without inserting");
      return NextResponse.json({ ok: true, request_id: requestId });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    if (!(await checkRateLimit(ip))) {
      log.warn("Rate limit exceeded", { ip });
      return NextResponse.json(
        { error: "Too many requests", request_id: requestId },
        { status: 429 }
      );
    }

    const supabase = getServerSupabase();
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone ?? null,
        country: data.country ?? null,
        package_slug: data.package_slug ?? null,
        message: data.message ?? null,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      log.error("Lead insert failed", { error: error.message });
      return NextResponse.json(
        { error: "Failed to save", request_id: requestId },
        { status: 500 }
      );
    }

    log.info("Lead created", { lead_id: lead.id });
    return NextResponse.json({
      lead_id: lead.id,
      request_id: requestId,
    });
  } catch (err) {
    log.error("Leads API error", { err: String(err) });
    return NextResponse.json(
      { error: "Server error", request_id: requestId },
      { status: 500 }
    );
  }
}
