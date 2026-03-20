import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
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
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone, country, package_slug, message, selected_specialties, travel_companions, budget_range, created_at")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Failed to generate follow-up message" }, { status: 500 });
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
