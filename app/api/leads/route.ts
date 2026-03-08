// Revisado: OK — rate limit (10/min), mensajes de error amigables, contrato 201 + lead_id.
import { NextResponse } from "next/server";
import { LeadCreateSchema } from "@/lib/validation/lead";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPublishedPackageBySlug } from "@/lib/packages";
import { enqueueLeadCreatedAutomationJobs } from "@/lib/ai/automation";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

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

    const packageSlug = (data.package_slug ?? "").trim() || null;
    const pkg = packageSlug ? await getPublishedPackageBySlug(packageSlug) : null;
    const packageId = pkg?.id ?? null;

    const supabase = getServerSupabase();
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone ?? null,
        country: data.country ?? null,
        package_slug: packageSlug,
        package_id: packageId,
        message: data.message ?? null,
        specialist_ids: data.specialist_ids?.length ? data.specialist_ids : [],
        experience_ids: data.experience_ids?.length ? data.experience_ids : [],
        selected_specialties: data.selected_specialties?.length ? data.selected_specialties : [],
        selected_experience_categories: data.selected_experience_categories?.length ? data.selected_experience_categories : [],
        selected_experience_ids: data.selected_experience_ids?.length ? data.selected_experience_ids : [],
        travel_companions: data.travel_companions?.trim() || null,
        budget_range: data.budget_range?.trim() || null,
        utm_source: data.utm_source?.trim() || null,
        utm_medium: data.utm_medium?.trim() || null,
        utm_campaign: data.utm_campaign?.trim() || null,
        utm_term: data.utm_term ?? null,
        utm_content: data.utm_content ?? null,
        landing_path: data.landing_path ?? null,
        referrer_url: data.referrer_url ?? null,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      log.error("Lead insert failed", { error: error.message });
      return NextResponse.json(
        { error: "We could not save your request. Please try again.", request_id: requestId },
        { status: 500 }
      );
    }

    if (lead.id && packageId && pkg) {
      const { error: bookingError } = await supabase.from("bookings").insert({
        lead_id: lead.id,
        package_id: packageId,
        provider_id: pkg.provider_id ?? null,
        status: "pending",
        deposit_cents: pkg.deposit_cents ?? null,
      });
      if (bookingError) {
        log.warn("Booking insert failed (lead created)", { error: bookingError.message });
      }
    }

    log.info("Lead created", { lead_id: lead.id });
    const ctaUrl = `${new URL(request.url).origin}/assessment`;
    void enqueueLeadCreatedAutomationJobs(lead.id as string, { requestId, ctaUrl })
      .then((jobs) => {
        log.info("Automation jobs enqueued", { lead_id: lead.id, trigger_type: "lead_created", job_count: jobs.length });
      })
      .catch((err) => {
        log.error("Lead-created automation enqueue failed", {
          lead_id: lead.id,
          trigger_type: "lead_created",
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return NextResponse.json({ lead_id: lead.id, request_id: requestId }, { status: 201 });
  } catch (err) {
    log.error("Leads API error", { err: String(err) });
    return NextResponse.json(
      { error: "Server error", request_id: requestId },
      { status: 500 }
    );
  }
}
