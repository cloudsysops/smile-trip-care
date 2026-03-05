import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import StatusDashboard from "./StatusDashboard";

export default async function AdminStatusPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/status");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-semibold">Admin — System status</h1>
          <div className="flex gap-4">
            <Link href="/admin/leads" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
              Leads
            </Link>
            <Link href="/admin/assets" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
              Assets
            </Link>
            <form action="/api/auth/signout" method="post" className="inline">
              <button type="submit" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <StatusDashboard />
      </main>
    </div>
  );
}
