import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { AssetFilterSchema } from "@/lib/validation/asset";

const BUCKET = "assets";
const SIGNED_EXPIRY = 3600;

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const params = {
      category: url.searchParams.get("category") || undefined,
      location: url.searchParams.get("location") || undefined,
      approved:
        url.searchParams.get("approved") != null
          ? url.searchParams.get("approved") === "true"
          : undefined,
      published:
        url.searchParams.get("published") != null
          ? url.searchParams.get("published") === "true"
          : undefined,
      q: url.searchParams.get("q") || undefined,
      page: url.searchParams.get("page") || undefined,
      pageSize: url.searchParams.get("pageSize") || undefined,
    };

    const parsed = AssetFilterSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
    }

    const { category, location, approved, published, q, page, pageSize } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = getServerSupabase();
    let query = supabase
      .from("assets")
      .select(
        "id, title, category, location, tags, approved, published, storage_path, alt_text, created_at, deleted_at",
        { count: "exact" },
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (category) query = query.eq("category", category);
    if (location) query = query.eq("location", location);
    if (typeof approved === "boolean") query = query.eq("approved", approved);
    if (typeof published === "boolean") query = query.eq("published", published);
    if (q) {
      const term = q.trim();
      if (term.length > 0) {
        query = query.or(`title.ilike.%${term}%,alt_text.ilike.%${term}%`);
      }
    }

    const { data, error, count } = await query;
    if (error) {
      log.error("Failed to list assets", { error: error.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }

    const storage = supabase.storage.from(BUCKET);
    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        let signed_url: string | null = null;
        if (row.storage_path) {
          const { data: signed } = await storage.createSignedUrl(row.storage_path as string, SIGNED_EXPIRY);
          signed_url = signed?.signedUrl ?? null;
        }
        return {
          ...row,
          signed_url,
        };
      }),
    );

    return NextResponse.json({
      items,
      count: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    log.error("Assets list endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}

