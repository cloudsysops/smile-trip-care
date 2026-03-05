import { getServerSupabase } from "@/lib/supabase/server";

export type PublicAsset = {
  id: string;
  title: string | null;
  category: string | null;
  location: string | null;
  tags: string[] | null;
  alt_text: string | null;
  url: string | null;
};

type GetPublishedAssetsParams = {
  limit?: number;
  category?: string;
  location?: string;
};

/**
 * Fetch approved+published assets for public rendering.
 * Uses service-role Supabase client on the server and signed URLs.
 */
export async function getPublishedAssets(
  params: GetPublishedAssetsParams = {},
): Promise<PublicAsset[]> {
  const { limit = 6, category, location } = params;
  try {
    const supabase = getServerSupabase();
    let query = supabase
      .from("assets")
      .select(
        "id, title, category, location, tags, alt_text, storage_path, approved, published, deleted_at",
      )
      .eq("approved", true)
      .eq("published", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq("category", category);
    }
    if (location) {
      query = query.eq("location", location);
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }

    const storage = supabase.storage.from("assets");
    const withUrls = await Promise.all(
      data.map(async (row) => {
        let url: string | null = null;
        if (row.storage_path) {
          const { data: signed, error: signedError } =
            await storage.createSignedUrl(row.storage_path as string, 3600);
          if (!signedError && signed?.signedUrl) {
            url = signed.signedUrl;
          }
        }
        return {
          id: row.id as string,
          title: (row.title as string | null) ?? null,
          category: (row.category as string | null) ?? null,
          location: (row.location as string | null) ?? null,
          tags: (row.tags as string[] | null) ?? null,
          alt_text: (row.alt_text as string | null) ?? null,
          url,
        };
      }),
    );

    return withUrls;
  } catch {
    return [];
  }
}

