import { NextRequest, NextResponse } from "next/server";
import { requireHost } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import { HostServiceCreateSchema } from "@/lib/validation/host-service";
import { createLogger } from "@/lib/logger";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requireHost();
    const host = await getHostByProfileId(profile.id);
    if (!host) {
      return NextResponse.json({ error: "Host profile not found", request_id: requestId }, { status: 404 });
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, host_id, name, description, category, price_cents, price_per, city, duration_hours, max_capacity, is_active, created_at",
      )
      .eq("host_id", host.id)
      .order("created_at", { ascending: false });
    if (error) {
      log.error("host services list failed", { error: error.message });
      return NextResponse.json({ error: "Failed to load services", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json({ services: data ?? [], request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("GET /api/host/services failed", { error: msg });
    return NextResponse.json({ error: "Failed to load services", request_id: requestId }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requireHost();
    const host = await getHostByProfileId(profile.id);
    if (!host) {
      return NextResponse.json({ error: "Host profile not found", request_id: requestId }, { status: 404 });
    }
    const body = await req.json();
    const parsed = HostServiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }
    const p = parsed.data;
    const supabase = getServerSupabase();
    const { data: inserted, error } = await supabase
      .from("services")
      .insert({
        host_id: host.id,
        name: p.name,
        description: p.description ?? null,
        category: p.category,
        price_cents: p.price_cents,
        price_per: p.price_per ?? "person",
        city: p.city ?? null,
        duration_hours: p.duration_hours ?? null,
        max_capacity: p.max_capacity ?? null,
        is_active: true,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      log.error("host service insert failed", { error: error?.message });
      return NextResponse.json({ error: "Failed to create service", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json({ id: inserted.id, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("POST /api/host/services failed", { error: msg });
    return NextResponse.json({ error: "Failed to create service", request_id: requestId }, { status: 500 });
  }
}
