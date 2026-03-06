import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { AssetUploadSchema, validateAssetFile } from "@/lib/validation/asset";
import { jsonBadRequest, jsonForbidden, jsonInternalServerError } from "@/lib/http/response";

const BUCKET = "assets";

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 100) || "image";
}

export async function POST(request: Request) {
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
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return jsonBadRequest("Expected multipart/form-data", requestId);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonBadRequest("Invalid form data", requestId);
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonBadRequest("Image file is required", requestId);
    }

    const validation = validateAssetFile(file);
    if (!validation.ok) {
      return jsonBadRequest(validation.error, requestId);
    }

    const raw = {
      title: (formData.get("title") ?? file.name).toString(),
      category: (formData.get("category") ?? "").toString(),
      location: (formData.get("location") ?? "").toString(),
      tags: (formData.get("tags") ?? "").toString(),
      alt_text: (formData.get("alt_text") ?? "").toString(),
      source_url: (formData.get("source_url") ?? "").toString(),
    };
    const parsed = AssetUploadSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonBadRequest("Invalid metadata", requestId);
    }

    const { title, category, location, tags, alt_text, source_url } = parsed.data;
    const normalizedTags = tags.slice(0, 16).map((tag) => tag.toLowerCase());
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
    const storagePath = `assets/${year}/${month}/${uuid}-${baseName}.${extension}`;

    const supabase = getServerSupabase();
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadError) {
      log.error("Storage upload failed", { error: uploadError.message });
      return jsonInternalServerError(requestId);
    }

    const { data, error } = await supabase
      .from("assets")
      .insert({
        slug: uuid,
        kind: "image",
        url: null,
        title,
        storage_path: storagePath,
        category,
        location,
        tags: normalizedTags,
        alt_text,
        source_url,
        approved: false,
        published: false,
        deleted_at: null,
      })
      .select("id, title, category, location, tags, approved, published, storage_path, alt_text, created_at")
      .single();
    if (error) {
      log.error("Assets insert failed", { error: error.message });
      return jsonInternalServerError(requestId);
    }

    log.info("Admin asset uploaded", { admin_user_id: adminUserId, asset_id: data.id, storage_path: storagePath });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    log.error("Asset upload endpoint failed", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}

