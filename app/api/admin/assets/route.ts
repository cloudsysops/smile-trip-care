import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { AssetFilterSchema } from "@/lib/validation/asset";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    return NextResponse.json(
      { error: "Invalid filters", details: parsed.error.flatten() },
      { status: 400 },
    );
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
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const storage = supabase.storage.from("assets");
  const items =
    data &&
    (await Promise.all(
      data.map(async (row) => {
        let signedUrl: string | null = null;
        if (row.storage_path) {
          const { data: signed, error: signedError } = await storage.createSignedUrl(
            row.storage_path as string,
            3600,
          );
          if (!signedError && signed?.signedUrl) {
            signedUrl = signed.signedUrl;
          }
        }
        return {
          ...row,
          signed_url: signedUrl,
        };
      }),
    ));

  return NextResponse.json({
    items: items ?? [],
    count: count ?? 0,
    page,
    pageSize,
  });
}

