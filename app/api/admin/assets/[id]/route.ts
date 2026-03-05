import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { AssetUpdateSchema } from "@/lib/validation/asset";
import { createLogger } from "@/lib/logger";

const BUCKET = "assets";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = AssetUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const supabase = getServerSupabase();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.category !== undefined) updates.category = parsed.data.category;
    if (parsed.data.location !== undefined) updates.location = parsed.data.location;
    if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;
    if (parsed.data.alt_text !== undefined) updates.alt_text = parsed.data.alt_text;
    if (parsed.data.source_url !== undefined) updates.source_url = parsed.data.source_url;
    if (parsed.data.approved !== undefined) updates.approved = parsed.data.approved;
    if (parsed.data.published !== undefined) updates.published = parsed.data.published;

    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      log.error("Failed to update asset", { id, error: error.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    log.info("Asset updated", { id });
    return NextResponse.json(data);
  } catch (err) {
    log.error("Asset PATCH endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const supabase = getServerSupabase();
    const { data: asset, error: fetchError } = await supabase
      .from("assets")
      .select("storage_path")
      .eq("id", id)
      .single();
    if (fetchError || !asset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (asset.storage_path) {
      await supabase.storage.from(BUCKET).remove([asset.storage_path]);
    }
    const { error: deleteError } = await supabase.from("assets").delete().eq("id", id);
    if (deleteError) {
      log.error("Asset row delete failed", { id, error: deleteError.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    log.info("Asset deleted", { id });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    log.error("Asset DELETE endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
