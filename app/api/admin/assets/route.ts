import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const BUCKET = "assets";
const SIGNED_EXPIRY = 3600;

export type AssetRow = {
  id: string;
  slug: string;
  kind: string;
  url: string | null;
  title: string | null;
  storage_path: string | null;
  category: string | null;
  location: string | null;
  tags: string[] | null;
  alt_text: string | null;
  source_url: string | null;
  approved: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  signed_url?: string | null;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const location = searchParams.get("location") ?? undefined;
  const approved = searchParams.get("approved");
  const published = searchParams.get("published");
  const search = searchParams.get("search")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Math.max(0, Number(searchParams.get("offset")) || 0);

  const supabase = getServerSupabase();
  let q = supabase
    .from("assets")
    .select("id, slug, kind, url, title, storage_path, category, location, tags, alt_text, source_url, approved, published, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (category) q = q.eq("category", category);
  if (location) q = q.eq("location", location);
  if (approved === "true") q = q.eq("approved", true);
  if (approved === "false") q = q.eq("approved", false);
  if (published === "true") q = q.eq("published", true);
  if (published === "false") q = q.eq("published", false);
  if (search) {
    q = q.or(`title.ilike.%${search}%,alt_text.ilike.%${search}%`);
  }
  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = (data ?? []) as (AssetRow & { storage_path?: string | null })[];
  for (const row of rows) {
    if (row.storage_path) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(row.storage_path, SIGNED_EXPIRY);
      row.signed_url = signed?.signedUrl ?? null;
    }
  }
  return NextResponse.json({ data: rows, total: count ?? 0 });
}
