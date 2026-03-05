import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { AssetUploadSchema, validateAssetFile } from "@/lib/validation/asset";
import { createLogger } from "@/lib/logger";

const BUCKET = "assets";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "image";
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
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const validation = validateAssetFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const raw = {
      title: formData.get("title"),
      category: formData.get("category"),
      location: formData.get("location"),
      tags: formData.get("tags") ?? "",
      alt_text: formData.get("alt_text"),
      source_url: formData.get("source_url") ?? "",
    };
    const parsed = AssetUploadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }
    const { title, category, location, tags, alt_text, source_url } = parsed.data;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const yyyy = new Date().getFullYear();
    const mm = String(new Date().getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
    const storagePath = `${yyyy}/${mm}/${uuid}-${baseName}.${ext}`;

    const supabase = getServerSupabase();
    const buf = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buf, {
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) {
      log.error("Storage upload failed", { error: uploadError.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    const slug = `${uuid}-${baseName}`;
    const { data: row, error: insertError } = await supabase
      .from("assets")
      .insert({
        slug,
        kind: "image",
        url: null,
        title,
        storage_path: storagePath,
        category,
        location,
        tags,
        alt_text,
        source_url,
        approved: false,
        published: false,
      })
      .select()
      .single();
    if (insertError) {
      log.error("Assets insert failed", { error: insertError.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    log.info("Asset uploaded", { id: row.id, storage_path: storagePath });
    return NextResponse.json(row);
  } catch (err) {
    log.error("Asset upload endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
