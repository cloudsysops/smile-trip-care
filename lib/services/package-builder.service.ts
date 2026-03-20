import { getServerSupabase } from "@/lib/supabase/server";
import { getPublishedPackageBySlug, type PackageRow } from "@/lib/packages";

export type BuilderCategory = "transport" | "lodging" | "clinic" | "tour" | "food" | "other";

export type BuilderItem = {
  id: string;
  experienceId: string;
  name: string;
  description: string | null;
  category: BuilderCategory;
  city: string | null;
  includedByDefault: boolean;
  priceCents: number;
  optional: boolean;
};

export type BuilderPackage = PackageRow;

export type BuilderEstimate = {
  totalCents: number;
  depositCents: number;
  items: { id: string; name: string; priceCents: number; included: boolean }[];
};

export async function getBuilderPackageBySlug(slug: string): Promise<BuilderPackage | null> {
  return getPublishedPackageBySlug(slug);
}

export async function getPackageBuilderItems(packageId: string): Promise<BuilderItem[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("package_experiences")
    .select(
      `
      id,
      package_id,
      experience_id,
      included,
      price_override_cents,
      sort_order,
      experiences (
        id,
        name,
        description,
        category,
        base_price_cents,
        city
      )
    `,
    )
    .eq("package_id", packageId)
    .order("sort_order");

  if (error || !data) {
    return [];
  }

  return (data as unknown[]).flatMap((rowUnknown) => {
    const row = rowUnknown as {
      id: string;
      included: boolean | null;
      price_override_cents: number | null;
      experiences:
        | {
            id: string;
            name: string;
            description: string | null;
            category: string | null;
            base_price_cents: number | null;
            city: string | null;
          }
        | null;
    };

    const exp = row.experiences;
    if (!exp) return [];

    const rawCategory = (exp.category ?? "other").toLowerCase();
    const category: BuilderCategory =
      rawCategory === "transport" ||
      rawCategory === "lodging" ||
      rawCategory === "clinic" ||
      rawCategory === "tour" ||
      rawCategory === "food"
        ? (rawCategory as BuilderCategory)
        : "other";

    const priceCents =
      typeof row.price_override_cents === "number" && row.price_override_cents > 0
        ? row.price_override_cents
        : typeof exp.base_price_cents === "number" && exp.base_price_cents > 0
          ? exp.base_price_cents
          : 0;

    const includedByDefault = row.included !== false;

    return [
      {
        id: row.id as string,
        experienceId: exp.id,
        name: exp.name,
        description: exp.description ?? null,
        category,
        city: exp.city ?? null,
        includedByDefault,
        priceCents,
        optional: !includedByDefault,
      } satisfies BuilderItem,
    ];
  });
}

export function groupBuilderItemsByCategory(items: BuilderItem[]): Record<BuilderCategory, BuilderItem[]> {
  const groups: Record<BuilderCategory, BuilderItem[]> = {
    transport: [],
    lodging: [],
    clinic: [],
    tour: [],
    food: [],
    other: [],
  };

  for (const item of items) {
    groups[item.category].push(item);
  }

  return groups;
}

export function calculateBuilderEstimate(
  items: BuilderItem[],
  selectedItemIds: string[],
  depositPercentage: number = 0.3,
): BuilderEstimate {
  const selected = new Set(selectedItemIds);

  let total = 0;
  const breakdown: { id: string; name: string; priceCents: number; included: boolean }[] = [];

  for (const item of items) {
    const mustInclude = item.includedByDefault;
    const chosen = mustInclude || selected.has(item.id);
    if (!chosen) continue;

    const price = item.priceCents;
    total += price;
    breakdown.push({
      id: item.id,
      name: item.name,
      priceCents: price,
      included: mustInclude,
    });
  }

  const deposit = Math.round(total * depositPercentage);

  return {
    totalCents: total,
    depositCents: deposit,
    items: breakdown,
  };
}

