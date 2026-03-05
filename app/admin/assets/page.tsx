import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AssetsPageClient from "./AssetsPage";

export default async function AdminAssetsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/assets");
  }

  return <AssetsPageClient />;
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AssetsManager from "./AssetsManager";

export default async function AdminAssetsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/assets");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Admin — Assets</h1>
            <Link href="/admin/leads" className="text-sm text-zinc-600 hover:underline">Leads</Link>
            <Link href="/admin/assets/new" className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">Upload</Link>
          </div>
          <form action="/api/auth/signout" method="post" className="inline">
            <button type="submit" className="text-sm text-zinc-600 hover:underline">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <AssetsManager />
      </main>
    </div>
  );
}
