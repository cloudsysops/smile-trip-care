import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { AssetCategorySchema, AssetLocationSchema } from "@/lib/validation/asset";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MetadataSchema = z.object({
  title: z.string().min(1).max(300),
  category: AssetCategorySchema,
  location: AssetLocationSchema,
  tags: z.string().optional(),
  alt_text: z.string().min(1).max(500),
  source_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const raw = {
    title: (formData.get("title") ?? file.name).toString(),
    category: (formData.get("category") ?? "").toString(),
    location: (formData.get("location") ?? "").toString(),
    tags: formData.get("tags")?.toString(),
    alt_text: (formData.get("alt_text") ?? "").toString(),
    source_url: formData.get("source_url")?.toString() || undefined,
  };

  const parsed = MetadataSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid metadata", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { title, category, location, alt_text, source_url } = parsed.data;
  const tagsRaw = parsed.data.tags ?? "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 16)
    .map((t) => t.toLowerCase());

  const supabase = getServerSupabase();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();

  const originalName = file.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9.\-]/g, "");
  const baseName = originalName || "image";
  const storagePath = `assets/${year}/${month}/${uuid}-${baseName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
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
      tags,
      alt_text,
      source_url: source_url ?? null,
      approved: false,
      published: false,
      deleted_at: null,
    })
    .select("id, title, category, location, tags, approved, published, storage_path, alt_text, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

