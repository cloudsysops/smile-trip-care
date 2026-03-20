import { NextResponse } from "next/server";
import { requireSpecialist } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { jsonError } from "@/lib/http/response";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export async function GET(_request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    return jsonError(401, "Unauthorized", requestId);
  }

  const { id } = await params;
  const supabase = getServerSupabase();

  const { data: consultation, error: consultationError } = await supabase
    .from("consultations")
    .select("id, lead_id, specialist_id, status, requested_at, scheduled_at, notes")
    .eq("id", id)
    .maybeSingle();

  if (consultationError || !consultation) {
    return jsonError(404, "Case not found", requestId);
  }

  const specialistId = profile.specialist_id;
  const isAdmin = profile.role === "admin";
  if (!isAdmin && (!specialistId || consultation.specialist_id !== specialistId)) {
    return jsonError(403, "Forbidden", requestId);
  }

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, first_name, last_name, status, message, package_slug, selected_specialties")
    .eq("id", consultation.lead_id)
    .maybeSingle();

  if (leadError || !lead) {
    return jsonError(404, "Lead not found", requestId);
  }

  let progressQuery = supabase
    .from("treatment_progress")
    .select("id, stage_key, stage_label, status, notes, created_at, updated_at")
    .eq("lead_id", consultation.lead_id)
    .order("created_at", { ascending: true });

  if (!isAdmin && specialistId) {
    progressQuery = progressQuery.eq("specialist_id", specialistId);
  }

  const { data: progress, error: progressError } = await progressQuery;
  if (progressError) {
    return jsonError(500, "Failed to load progress", requestId);
  }

  const selectedSpecialties = Array.isArray(lead.selected_specialties)
    ? lead.selected_specialties.filter((item): item is string => typeof item === "string")
    : [];

  const recommendations: string[] = [];
  if (consultation.status === "requested") {
    recommendations.push("Confirm consultation date and share pre-consult checklist.");
  }
  if (consultation.status === "scheduled") {
    recommendations.push("Upload a same-day progress update after the consultation.");
  }
  if ((progress ?? []).length === 0) {
    recommendations.push("Add first progress note so coordinator and patient can track the case.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Continue weekly progress updates until treatment is marked completed.");
  }

  return NextResponse.json({
    ok: true,
    case: consultation,
    lead: {
      id: lead.id,
      patient_name: `${lead.first_name} ${lead.last_name}`.trim(),
      status: lead.status,
      notes: lead.message,
      package_slug: lead.package_slug,
      treatment_interest: selectedSpecialties,
    },
    progress: progress ?? [],
    recommendations,
  });
}

