import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPatientDashboardData } from "@/lib/dashboard-data";
import {
  addDaysToIsoDate,
  getTripAnchorDateForLead,
  listItineraryItemsForLead,
  serviceCategoryToItemType,
} from "@/lib/patient-itinerary";
import { createLogger } from "@/lib/logger";

const PostSchema = z.object({
  lead_id: z.string().uuid().optional(),
  service_id: z.string().uuid(),
  trip_day: z.number().int().min(0).max(60).default(0),
});

async function resolveLeadId(profileEmail: string | null, requested?: string): Promise<string | null> {
  if (!profileEmail?.trim()) return null;
  const data = await getPatientDashboardData(profileEmail);
  const leads = data.leads as { id: string }[];
  if (leads.length === 0) return null;
  if (requested && leads.some((l) => l.id === requested)) return requested;
  return leads[0]?.id ?? null;
}

/** Patient trip builder — list / add / remove itinerary lines for own lead(s). */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requirePatient();
    const leadParam = req.nextUrl.searchParams.get("lead_id");
    const leadId = await resolveLeadId(profile.email, leadParam ?? undefined);
    if (!leadId) {
      return NextResponse.json({ error: "No lead found for your account", request_id: requestId }, { status: 404 });
    }
    const [items, anchor] = await Promise.all([
      listItineraryItemsForLead(leadId),
      getTripAnchorDateForLead(leadId),
    ]);
    return NextResponse.json({ items, lead_id: leadId, anchor_date: anchor, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("GET /api/patient/itinerary failed", { error: msg });
    return NextResponse.json({ error: "Failed to load itinerary", request_id: requestId }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requirePatient();
    const body = await req.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const leadId = await resolveLeadId(profile.email, parsed.data.lead_id);
    if (!leadId) {
      return NextResponse.json({ error: "No lead found for your account", request_id: requestId }, { status: 404 });
    }
    const supabase = getServerSupabase();
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, name, description, category, price_cents, is_active")
      .eq("id", parsed.data.service_id)
      .eq("is_active", true)
      .maybeSingle();
    if (svcErr || !service) {
      return NextResponse.json({ error: "Service not found", request_id: requestId }, { status: 404 });
    }
    const anchor = await getTripAnchorDateForLead(leadId);
    const scheduled = addDaysToIsoDate(anchor, parsed.data.trip_day);
    const itemType = serviceCategoryToItemType(String(service.category ?? "other"));
    const price =
      typeof service.price_cents === "number"
        ? service.price_cents
        : typeof service.price_cents === "string"
          ? Number(service.price_cents)
          : 0;
    const { data: inserted, error: insErr } = await supabase
      .from("itinerary_items")
      .insert({
        lead_id: leadId,
        service_id: service.id,
        item_type: itemType,
        title: service.name as string,
        description: (service.description as string | null) ?? null,
        scheduled_date: scheduled,
        price_cents: Number.isFinite(price) ? price : 0,
        status: "pending",
      })
      .select(
        "id, lead_id, service_id, item_type, title, description, scheduled_date, scheduled_time, duration_hours, price_cents, status, notes, created_at",
      )
      .single();
    if (insErr || !inserted) {
      log.error("itinerary insert failed", { error: insErr?.message });
      return NextResponse.json({ error: "Failed to add service", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json({ item: inserted, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("POST /api/patient/itinerary failed", { error: msg });
    return NextResponse.json({ error: "Failed to add service", request_id: requestId }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requirePatient();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id", request_id: requestId }, { status: 400 });
    }
    const leadId = await resolveLeadId(profile.email);
    if (!leadId) {
      return NextResponse.json({ error: "No lead found for your account", request_id: requestId }, { status: 404 });
    }
    const supabase = getServerSupabase();
    const { error } = await supabase.from("itinerary_items").delete().eq("id", id).eq("lead_id", leadId);
    if (error) {
      log.error("itinerary delete failed", { error: error.message });
      return NextResponse.json({ error: "Failed to remove item", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json({ ok: true, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("DELETE /api/patient/itinerary failed", { error: msg });
    return NextResponse.json({ error: "Failed to remove item", request_id: requestId }, { status: 500 });
  }
}
