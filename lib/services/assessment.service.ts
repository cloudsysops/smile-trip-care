import { LeadCreateSchema } from "@/lib/validation/lead";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPublishedPackageBySlug } from "@/lib/packages";
import { enqueueLeadCreatedAutomationJobs } from "@/lib/ai/automation";
import { recordStageTransition } from "@/lib/services/patient-pipeline.service";

type LeadCreateInput = typeof LeadCreateSchema._type;

type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export type CreateLeadFromAssessmentResult = {
  leadId: string;
  recommendedPackageSlug: string | null;
};

/**
 * Enrich parsed assessment data with attribution and recommendation fields.
 * Keeps all string trimming and null coalescing rules in one place.
 */
export function enrichLeadWithAttribution(
  data: LeadCreateInput,
  packageSlug: string | null,
  packageId: string | null,
) {
  return {
    utm_source: data.utm_source?.trim() || null,
    utm_medium: data.utm_medium?.trim() || null,
    utm_campaign: data.utm_campaign?.trim() || null,
    utm_term: data.utm_term ?? null,
    utm_content: data.utm_content ?? null,
    landing_path: data.landing_path ?? null,
    referrer_url: data.referrer_url ?? null,
    recommended_package_slug: packageSlug,
    recommended_package_id: packageId,
  };
}

/**
 * Trigger automation jobs after a lead has been created.
 */
export async function triggerAssessmentAutomation(
  leadId: string,
  requestId: string,
  requestUrl: string,
  log: Logger,
) {
  const ctaUrl = `${new URL(requestUrl).origin}/assessment`;
  try {
    const jobs = await enqueueLeadCreatedAutomationJobs(leadId, { requestId, ctaUrl });
    log.info("Automation jobs enqueued", {
      lead_id: leadId,
      trigger_type: "lead_created",
      job_count: jobs.length,
    });
  } catch (err) {
    log.error("Lead-created automation enqueue failed", {
      lead_id: leadId,
      trigger_type: "lead_created",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Create a lead (and optional booking) from validated assessment input.
 * Returns the new lead id and recommended package slug.
 *
 * This keeps the original logging and error semantics used in /api/leads.
 */
export async function createLeadFromAssessment(
  data: LeadCreateInput,
  opts: {
    requestId: string;
    requestUrl: string;
    log: Logger;
  },
): Promise<CreateLeadFromAssessmentResult> {
  const { requestId, requestUrl, log } = opts;

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
      selected_experience_categories: data.selected_experience_categories?.length
        ? data.selected_experience_categories
        : [],
      selected_experience_ids: data.selected_experience_ids?.length ? data.selected_experience_ids : [],
      travel_companions: data.travel_companions?.trim() || null,
      budget_range: data.budget_range?.trim() || null,
      ...enrichLeadWithAttribution(data, packageSlug, packageId),
      status: "new",
    })
    .select("id")
    .single();

  if (error) {
    const errPayload = {
      request_id: requestId,
      step: "leads.insert",
      table: "leads",
      supabase_code: error.code ?? "unknown",
      supabase_message: error.message,
      supabase_details: typeof error.details === "string" ? error.details : undefined,
      supabase_hint:
        typeof (error as { hint?: string }).hint === "string"
          ? (error as { hint: string }).hint
          : undefined,
    };
    log.error("Lead insert failed", errPayload);
    throw new Error("lead_insert_failed");
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
  await triggerAssessmentAutomation(lead.id as string, requestId, requestUrl, log);

  // Phase C+: wire patient pipeline for lead_created / assessment_submitted.
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (!profileError && profile?.id) {
      const { error: pipelineError } = await recordStageTransition({
        patientId: profile.id as string,
        assessmentId: lead.id as string,
        stage: "assessment_submitted",
        notes: "Assessment submitted via /api/leads",
      });
      if (pipelineError) {
        log.warn("Patient pipeline write failed after lead creation", {
          lead_id: lead.id,
          patient_id: profile.id,
          error: pipelineError,
        });
      }
    } else {
      log.info("No matching patient profile found for pipeline; skipping", {
        lead_id: lead.id,
        email: data.email,
      });
    }
  } catch (err) {
    log.warn("Patient pipeline write skipped due to error", {
      lead_id: lead.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    leadId: lead.id as string,
    recommendedPackageSlug: packageSlug,
  };
}

