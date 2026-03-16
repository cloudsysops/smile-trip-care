import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSpecialist } from "@/lib/auth";
import { getSpecialistDashboardData } from "@/lib/dashboard-data";
import RoleDashboardHeader from "@/app/components/dashboard/RoleDashboardHeader";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import EmptyState from "@/app/components/ui/EmptyState";

export default async function SpecialistDashboardPage() {
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/specialist");
  }
  const specialistId = profile.specialist_id;
  if (!specialistId) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <RoleDashboardHeader title="Specialist dashboard" navItems={[{ href: "/specialist", label: "Overview", active: true }]} homeLabel="Home" />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-zinc-600">Your account is not linked to a specialist. Contact an admin.</p>
        </main>
      </div>
    );
  }
  const data = await getSpecialistDashboardData(specialistId);
  const specialist = data.specialist as { id: string; name: string; specialty: string; city: string; approval_status: string; published: boolean } | null;
  const consultations = data.consultations as { id: string; lead_id: string; status: string; requested_at: string | null; scheduled_at: string | null }[];

  return (
    <div className="min-h-screen bg-zinc-50">
      <RoleDashboardHeader
        title="Specialist dashboard"
        navItems={[
          { href: "/specialist", label: "Overview", active: true },
          { href: "/specialist/progress", label: "Progress" },
        ]}
        homeLabel="Home"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <DashboardLayout
          title={specialist?.name ?? "Specialist"}
          description={specialist?.specialty ? `Specialist · ${specialist.specialty}` : "Specialist overview"}
        >
          <DashboardSection>
            <div className="mb-2 rounded-lg border border-zinc-200 bg-white p-5">
              <p className="text-sm font-medium text-zinc-500">Consultation requests</p>
              <p className="mt-1 text-2xl font-semibold">{consultations.length}</p>
            </div>
          </DashboardSection>
          <DashboardSection title="Consultations">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {consultations.length === 0 ? (
                <EmptyState
                  title="No consultation requests yet"
                  description="When admin assigns or schedules consultations for you, they will appear here."
                />
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Lead ID</th>
                      <th className="px-4 py-3 font-medium">Requested</th>
                      <th className="px-4 py-3 font-medium">Scheduled</th>
                      <th className="px-4 py-3 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.slice(0, 15).map((c) => (
                      <tr key={c.id} className="border-b border-zinc-100">
                        <td className="px-4 py-3">{c.status}</td>
                        <td className="px-4 py-3 font-mono text-xs">{c.lead_id.slice(0, 8)}…</td>
                        <td className="px-4 py-3 text-zinc-600">
                          {c.requested_at ? new Date(c.requested_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/specialist/progress?lead_id=${encodeURIComponent(c.lead_id)}`}
                            className="text-sm font-medium text-emerald-600 hover:underline"
                          >
                            Update progress
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </DashboardSection>
        </DashboardLayout>
      </main>
    </div>
  );
}
