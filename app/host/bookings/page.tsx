import Link from "next/link";
import { redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import { getHostByProfileId, listHostBookings } from "@/lib/services/hosts.service";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";

export default async function HostBookingsPage() {
  let profile;
  try {
    const ctx = await requireHost();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/host/bookings");
  }
  const host = await getHostByProfileId(profile.id);
  if (!host) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <AuthDashboardHeader title="Bookings" homeHref="/host" homeLabel="Host" maxWidth="max-w-5xl" navItems={[]} />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm text-zinc-300">Your account is not configured as a host.</p>
        </main>
      </div>
    );
  }
  const bookings = await listHostBookings(host.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader title="Bookings" homeHref="/host" homeLabel="Host" maxWidth="max-w-5xl" navItems={[]} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <p className="text-sm text-zinc-400">
          Packages that include one of your experiences. Revenue totals are on your{" "}
          <Link href="/host" className="text-emerald-400 hover:underline">
            dashboard
          </Link>
          .
        </p>
        {bookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-400">
            No bookings yet that include your experiences.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {bookings.map((b) => (
                  <tr key={b.id} className="bg-zinc-950/40">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">{b.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{b.lead_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-zinc-200">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}
                    </td>
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
