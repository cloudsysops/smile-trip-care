import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { jsonBadRequest, jsonError, jsonForbidden } from "@/lib/http/response";
import {
  generate24hFollowup,
  generate3dFollowup,
  generate7dFollowup,
  scheduleFollowups,
  type LeadForFollowUp,
} from "@/lib/followup/lead-followup";

const BodySchema = z.object({ type: z.enum(["24h", "3d", "7d"]) }).strict();

type Props = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  try {
    await requireAdmin();
  } catch {
    return jsonForbidden(requestId);
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return jsonBadRequest("Invalid body", requestId);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonBadRequest("Invalid body", requestId);
  }

  const supabase = getServerSupabase();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone, country, package_slug, message, selected_specialties, travel_companions, budget_range, created_at")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return jsonError(404, "Lead not found", requestId);
  }

  const leadForFollowUp: LeadForFollowUp = {
    first_name: (lead.first_name as string) ?? "",
    last_name: (lead.last_name as string) ?? "",
    email: (lead.email as string) ?? "",
    phone: (lead.phone as string | null) ?? null,
    country: (lead.country as string | null) ?? null,
    package_slug: (lead.package_slug as string | null) ?? null,
    message: (lead.message as string | null) ?? null,
    selected_specialties: Array.isArray(lead.selected_specialties) ? lead.selected_specialties : null,
    travel_companions: (lead.travel_companions as string | null) ?? null,
    budget_range: (lead.budget_range as string | null) ?? null,
  };

  const schedule = scheduleFollowups((lead.created_at as string) ?? new Date().toISOString());

  let message: string | null = null;
  switch (parsed.data.type) {
    case "24h":
      message = await generate24hFollowup(leadForFollowUp);
      break;
    case "3d":
      message = await generate3dFollowup(leadForFollowUp);
      break;
    case "7d":
      message = await generate7dFollowup(leadForFollowUp);
      break;
  }

  if (message === null) {
    return jsonError(500, "Failed to generate follow-up message", requestId);
  }

  return NextResponse.json({
    message,
    schedule: {
      at24h: schedule.at24h.toISOString(),
      at3d: schedule.at3d.toISOString(),
      at7d: schedule.at7d.toISOString(),
    },
  });
}
