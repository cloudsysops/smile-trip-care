import { NextResponse } from "next/server";
import { requireProviderManager } from "@/lib/auth";
import { getPackageById, updatePackage } from "@/lib/packages";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { ProviderPackagePatchSchema } from "@/lib/validation/provider-package";

const PACKAGE_LIST_SELECT =
  "id, slug, name, location, published, provider_id, updated_at, deposit_cents, description";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requireProviderManager();
    const providerId = profile.provider_id?.trim() ?? "";
    if (!providerId) {
      return NextResponse.json(
        { error: "Provider not linked to this account", request_id: requestId },
        { status: 400 },
      );
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("packages")
      .select(PACKAGE_LIST_SELECT)
      .eq("provider_id", providerId)
      .order("name");
    if (error) {
      log.error("provider packages list failed", { err: error.message });
      return NextResponse.json({ error: "Failed to load packages", request_id: requestId }, { status: 500 });
    }
    return NextResponse.json({ packages: data ?? [], request_id: requestId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("GET /api/provider/packages failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requireProviderManager();
    const providerId = profile.provider_id?.trim() ?? "";
    if (!providerId) {
      return NextResponse.json(
        { error: "Provider not linked to this account", request_id: requestId },
        { status: 400 },
      );
    }
    const body = await request.json().catch(() => null);
    const parsed = ProviderPackagePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
          request_id: requestId,
        },
        { status: 400 },
      );
    }
    const { id, ...updates } = parsed.data;
    const existing = await getPackageById(id);
    if (!existing || (existing.provider_id ?? "") !== providerId) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    const { data, error } = await updatePackage(id, updates as Record<string, unknown>);
    if (error) {
      return NextResponse.json(
        { error: error || "Update failed", request_id: requestId },
        { status: 422 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json({ package: data, request_id: requestId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("PATCH /api/provider/packages failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
