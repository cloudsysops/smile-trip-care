import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getBookings } from "@/lib/bookings";

export default async function AdminBookingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/bookings");
  }
  const bookings = await getBookings();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <nav className="flex flex-wrap items-center gap-3">
            <Link href="/admin/overview" className="text-sm text-zinc-400 hover:underline">
              Overview
            </Link>
            <Link href="/admin/leads" className="text-sm text-zinc-400 hover:underline">
              Leads
            </Link>
            <Link href="/admin/providers" className="text-sm text-zinc-400 hover:underline">
              Providers
            </Link>
            <Link href="/admin/specialists" className="text-sm text-zinc-400 hover:underline">
              Specialists
            </Link>
            <Link href="/admin/experiences" className="text-sm text-zinc-400 hover:underline">
              Experiences
            </Link>
            <Link href="/admin/bookings" className="text-sm font-medium text-zinc-100 underline">
              Bookings
            </Link>
            <Link href="/admin/consultations" className="text-sm text-zinc-400 hover:underline">
              Consultations
            </Link>
            <Link href="/admin/assets" className="text-sm text-zinc-400 hover:underline">
              Assets
            </Link>
          </nav>
          <h1 className="text-xl font-semibold text-zinc-100">Admin — Bookings</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {bookings.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 text-zinc-400">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="px-4 py-3 font-semibold text-zinc-400">Lead ID</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Package ID</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Status</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Deposit</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-800">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{b.lead_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{b.package_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          b.status === "completed"
                            ? "text-emerald-300"
                            : b.status === "cancelled"
                              ? "text-red-300"
                              : "text-zinc-300"
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{b.deposit_paid ? "Paid" : "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{new Date(b.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
