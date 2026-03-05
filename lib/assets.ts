import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

const BUCKET = "assets";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

export type PublishedAsset = {
  id: string;
  slug: string;
  title: string | null;
  category: string | null;
  location: string | null;
  tags: string[] | null;
  alt_text: string | null;
  url: string; // signed or public URL for rendering
};

/**
 * Fetch assets that are approved AND published only.
 * Uses server Supabase; filters explicitly. For private bucket, attaches signed URLs.
 */
export async function getPublishedAssets(filters?: {
  category?: string;
  location?: string;
  tags?: string[];
  limit?: number;
}): Promise<PublishedAsset[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    let q = supabase
      .from("assets")
      .select("id, slug, title, category, location, tags, alt_text, storage_path")
      .eq("approved", true)
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(Math.min(filters?.limit ?? 24, 50));
    if (filters?.category) q = q.eq("category", filters.category);
    if (filters?.location) q = q.eq("location", filters.location);
    if (filters?.tags?.length) {
      q = q.overlaps("tags", filters.tags);
    }
    const { data, error } = await q;
    if (error) return [];
    const rows = (data ?? []) as { id: string; slug: string; title: string | null; category: string | null; location: string | null; tags: string[] | null; alt_text: string | null; storage_path: string | null }[];
    if (rows.length === 0) return [];
    const withUrls: PublishedAsset[] = [];
    for (const r of rows) {
      let url = "";
      if (r.storage_path) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(r.storage_path, SIGNED_URL_EXPIRY);
        url = signed?.signedUrl ?? "";
      }
      withUrls.push({
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.category,
        location: r.location,
        tags: r.tags,
        alt_text: r.alt_text,
        url,
      });
    }
    return withUrls;
  } catch {
    return [];
  }
}
