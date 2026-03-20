import { notFound } from "next/navigation";
import Link from "next/link";
import { branding } from "@/lib/branding";
import { getBuilderPackageBySlug, getPackageBuilderItems, groupBuilderItemsByCategory } from "@/lib/services/package-builder.service";
import BuilderClient from "./BuilderClient";

type Props = {
  searchParams: Promise<{ base?: string }>;
};

export default async function BuildPackagePage({ searchParams }: Props) {
  const params = await searchParams;
  const slug = params.base;
  if (!slug) notFound();

  const pkg = await getBuilderPackageBySlug(slug);
  if (!pkg) notFound();

  const items = await getPackageBuilderItems(pkg.id);
  const grouped = groupBuilderItemsByCategory(items);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/packages" className="text-sm text-zinc-400 hover:text-white">
              ← All packages
            </Link>
            <span className="text-sm text-zinc-500">Customize your journey</span>
          </div>
          <Link href="/" className="text-sm font-semibold text-zinc-200 hover:text-white">
            {branding.productName}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Build your {pkg.name} experience
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Start from a curated package and fine-tune transport, lodging, tours, and extras. This is an estimate; your
          coordinator will confirm details and final pricing before any commitment.
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <BuilderClient items={items} grouped={grouped} slug={slug} packageName={pkg.name} />
        </div>
      </main>
    </div>
  );
}
