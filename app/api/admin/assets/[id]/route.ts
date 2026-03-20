import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { AssetUpdateSchema } from "@/lib/validation/asset";
import { RouteIdParamSchema } from "@/lib/validation/common";
import { jsonBadRequest, jsonError, jsonForbidden, jsonInternalServerError } from "@/lib/http/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  let adminUserId = "";
  try {
    const { user } = await requireAdmin();
    adminUserId = user.id;
  } catch {
    return jsonForbidden(requestId);
  }
  try {
    const parsedParams = RouteIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonBadRequest("Invalid asset id", requestId);
    }
    const { id } = parsedParams.data;
    const json = await request.json().catch(() => ({}));
    const parsed = AssetUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return jsonBadRequest("Invalid body", requestId);
    }

    const body = parsed.data;
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.category !== undefined) updates.category = body.category;
    if (body.location !== undefined) updates.location = body.location;
    if (body.alt_text !== undefined) updates.alt_text = body.alt_text;
    if (body.source_url !== undefined) updates.source_url = body.source_url ?? null;
    if (body.tags !== undefined) {
      updates.tags = body.tags.map((tag) => tag.toLowerCase());
    }
    if (body.approved !== undefined) updates.approved = body.approved;
    if (body.published !== undefined) updates.published = body.published;

    if (Object.keys(updates).length === 0) {
      return jsonBadRequest("No updates provided", requestId);
    }

    updates.updated_at = new Date().toISOString();

    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id, title, category, location, tags, approved, published, storage_path, alt_text, source_url, created_at")
      .maybeSingle();

    if (error) {
      log.error("Failed to update asset", { id, error: error.message });
      return jsonInternalServerError(requestId);
    }
    if (!data) {
      return jsonError(404, "Not found", requestId);
    }

    log.info("Admin asset updated", { admin_user_id: adminUserId, asset_id: id });
    return NextResponse.json(data);
  } catch (err) {
    log.error("Asset PATCH endpoint failed", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  let adminUserId = "";
  try {
    const { user } = await requireAdmin();
    adminUserId = user.id;
  } catch {
    return jsonForbidden(requestId);
  }
  try {
    const parsedParams = RouteIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      return jsonBadRequest("Invalid asset id", requestId);
    }
    const { id } = parsedParams.data;
    const supabase = getServerSupabase();
    const { data: asset, error } = await supabase
      .from("assets")
      .select("id, storage_path")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      log.error("Failed to lookup asset for delete", { id, error: error.message });
      return jsonInternalServerError(requestId);
    }
    if (!asset) {
      return jsonError(404, "Not found", requestId);
    }

    const storagePath = asset.storage_path as string | null;
    if (storagePath) {
      await supabase.storage.from("assets").remove([storagePath]);
    }

    const { error: updateError } = await supabase
      .from("assets")
      .update({
        deleted_at: new Date().toISOString(),
        approved: false,
        published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null);

    if (updateError) {
      log.error("Failed to soft delete asset", { id, error: updateError.message });
      return jsonInternalServerError(requestId);
    }

    log.info("Admin asset deleted", { admin_user_id: adminUserId, asset_id: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error("Asset DELETE endpoint failed", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}

