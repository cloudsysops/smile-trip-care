import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { AssetUploadSchema, validateAssetFile } from "@/lib/validation/asset";

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
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const validation = validateAssetFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
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
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
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
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    log.error("Asset upload endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}

