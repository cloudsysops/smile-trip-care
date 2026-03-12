import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { getCoordinatorDashboardData } from "@/lib/dashboard-data";
import RoleDashboardHeader from "@/app/components/dashboard/RoleDashboardHeader";
import StatCard from "@/app/components/dashboard/StatCard";

export default async function CoordinatorDashboardPage() {
  try {
    await requireCoordinator();
  } catch {
    redirect("/login?next=/coordinator");
  }
  const data = await getCoordinatorDashboardData();
  const leads = data.leads as { id: string; first_name: string; last_name: string; email: string; status: string; created_at: string }[];
  const bookings = data.bookings as { id: string; lead_id: string; status: string; created_at: string }[];
  const consultations = data.consultations as { id: string; lead_id: string; status: string; requested_at: string | null; scheduled_at: string | null }[];

  return (
    <div className="min-h-screen bg-zinc-50">
      <RoleDashboardHeader title="Coordinator dashboard" navItems={[{ href: "/coordinator", label: "Overview", active: true }]} homeLabel="Home" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold">Operations & travel coordination</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active leads" value={leads.length} helper="new, contacted, qualified" />
          <StatCard label="Bookings in progress" value={bookings.length} helper="draft through pending" />
          <StatCard label="Consultations" value={consultations.length} helper="requested or scheduled" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-medium">Recent leads</h3>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {leads.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500">No active leads.</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 10).map((l) => (
                      <tr key={l.id} className="border-b border-zinc-100">
                        <td className="px-4 py-3">{l.first_name} {l.last_name}</td>
                        <td className="px-4 py-3">{l.status}</td>
                        <td className="px-4 py-3 text-zinc-600">{new Date(l.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-lg font-medium">Consultations needing follow-up</h3>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {consultations.length === 0 ? (
                <p className="p-6 text-sm text-zinc-500">None.</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.slice(0, 10).map((c) => (
                      <tr key={c.id} className="border-b border-zinc-100">
                        <td className="px-4 py-3">{c.status}</td>
                        <td className="px-4 py-3 text-zinc-600">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
