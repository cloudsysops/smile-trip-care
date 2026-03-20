import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";
import { getCoordinatorDashboardData } from "@/lib/dashboard-data";
import RoleDashboardHeader from "@/app/components/dashboard/RoleDashboardHeader";
import StatCard from "@/app/components/dashboard/StatCard";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import DataTable, { type DataTableColumn } from "@/app/components/dashboard/DataTable";
import EmptyState from "@/app/components/ui/EmptyState";

type CoordinatorLead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
};

type CoordinatorConsultation = {
  id: string;
  lead_id: string;
  status: string;
  requested_at: string | null;
  scheduled_at: string | null;
};

export default async function CoordinatorDashboardPage() {
  try {
    await requireCoordinator();
  } catch {
    redirect("/login?next=/coordinator");
  }
  const data = await getCoordinatorDashboardData();
  const leads = data.leads as CoordinatorLead[];
  const bookings = data.bookings as { id: string; lead_id: string; status: string; created_at: string }[];
  const consultations = data.consultations as CoordinatorConsultation[];

  const leadColumns: DataTableColumn<CoordinatorLead>[] = [
    {
      header: "Name",
      cell: (l) => `${l.first_name} ${l.last_name}`,
    },
    {
      header: "Status",
      cell: (l) => l.status,
    },
    {
      header: "Created",
      cell: (l) => new Date(l.created_at).toLocaleDateString(),
    },
  ];

  const consultationColumns: DataTableColumn<CoordinatorConsultation>[] = [
    {
      header: "Status",
      cell: (c) => c.status,
    },
    {
      header: "Scheduled",
      cell: (c) =>
        c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : "—",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <RoleDashboardHeader title="Coordinator dashboard" navItems={[{ href: "/coordinator", label: "Overview", active: true }]} homeLabel="Home" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <DashboardLayout
          title="Operations & travel coordination"
          description="Active leads, bookings in progress, and consultations needing follow-up."
        >
          <DashboardSection>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Active leads" value={leads.length} helper="new, contacted, qualified" />
              <StatCard label="Bookings in progress" value={bookings.length} helper="draft through pending" />
              <StatCard label="Consultations" value={consultations.length} helper="requested or scheduled" />
            </div>
          </DashboardSection>
          <DashboardSection title="Recent leads">
            <DataTable
              columns={leadColumns}
              rows={leads.slice(0, 10)}
              emptyMessage="No active leads."
            />
          </DashboardSection>
          <DashboardSection title="Consultations needing follow-up">
            {consultations.length === 0 ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <EmptyState
                  title="No consultations needing follow-up"
                  description="When consultations are scheduled or requested, they will appear here."
                />
              </div>
            ) : (
              <DataTable
                columns={consultationColumns}
                rows={consultations.slice(0, 10)}
                emptyMessage="No consultations."
              />
            )}
          </DashboardSection>
        </DashboardLayout>
      </main>
    </div>
  );
}
