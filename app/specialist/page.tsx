import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSpecialist } from "@/lib/auth";
import { getSpecialistDashboardData, type SpecialistConsultationListRow } from "@/lib/dashboard-data";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import EmptyState from "@/app/components/ui/EmptyState";
import SpecialistStripeConnectButton from "./StripeConnectButton";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";

const NAV_ITEMS = [
  { href: "/specialist", label: "Overview", active: true as const },
  { href: "/specialist/availability", label: "Availability" },
  { href: "/specialist/progress", label: "Progress" },
] as const;

function filterConsultations(
  rows: SpecialistConsultationListRow[],
  status: string,
  q: string,
): SpecialistConsultationListRow[] {
  let out = rows;
  if (status === "pending") {
    out = out.filter((c) => c.status === "requested" || c.status === "accepted");
  } else if (status === "active") {
    out = out.filter((c) => c.status === "scheduled");
  } else if (status === "completed") {
    out = out.filter((c) => c.status === "completed");
  }
  if (q.length > 0) {
    out = out.filter((c) => c.patient_name.toLowerCase().includes(q));
  }
  return out;
}

function formatNextAppointment(c: SpecialistConsultationListRow): string {
  if (!c.scheduled_at) return "—";
  try {
    return new Date(c.scheduled_at).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

type PageProps = Readonly<{ searchParams: Promise<{ status?: string; q?: string }> }>;

export default async function SpecialistDashboardPage({ searchParams }: PageProps) {
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
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <AuthDashboardHeader
          title="Specialist dashboard"
          navItems={NAV_ITEMS.map((item) => ({
            href: item.href,
            label: item.label,
            active: "active" in item && item.active === true,
          }))}
          homeHref="/"
          homeLabel="Home"
          maxWidth="max-w-4xl"
        />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-zinc-300">Your account is not linked to a specialist. Contact an admin.</p>
        </main>
      </div>
    );
  }
  const sp = await searchParams;
  const statusFilter = sp.status && ["all", "pending", "active", "completed"].includes(sp.status) ? sp.status : "all";
  const qRaw = (sp.q ?? "").trim();
  const qLower = qRaw.toLowerCase();

  const data = await getSpecialistDashboardData(specialistId);
  const specialist = data.specialist as {
    id: string;
    name: string;
    specialty: string;
    city: string;
    approval_status: string;
    published: boolean;
    stripe_onboarding_complete?: boolean | null;
    stripe_details_submitted?: boolean | null;
  } | null;
  const allConsultations = data.consultations as SpecialistConsultationListRow[];
  const consultations = filterConsultations(allConsultations, statusFilter, qLower);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="Specialist dashboard"
        navItems={NAV_ITEMS.map((item) => ({
          href: item.href,
          label: item.label,
          active: "active" in item && item.active === true,
        }))}
        homeHref="/"
        homeLabel="Home"
        maxWidth="max-w-4xl"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <DashboardLayout
          title={specialist?.name ?? "Specialist"}
          description={specialist?.specialty ? `Specialist · ${specialist.specialty}` : "Specialist overview"}
        >
          <DashboardSection>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payout setup</p>
                <p className="mt-1 text-sm text-zinc-300">
                  {specialist?.stripe_onboarding_complete
                    ? "Ready for automated payouts"
                    : specialist?.stripe_details_submitted
                      ? "Stripe details submitted · pending verification"
                      : "Stripe account not connected yet"}
                </p>
              </div>
              <SpecialistStripeConnectButton disabled={!!specialist?.stripe_onboarding_complete} />
            </div>
          </DashboardSection>
          <DashboardSection>
            <div className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-300">Consultation requests</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-50">{allConsultations.length}</p>
            </div>
          </DashboardSection>
          <DashboardSection title="Cases">
            <form
              method="get"
              action="/specialist"
              className="mb-4 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <div>
                <label htmlFor="status" className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={statusFilter}
                  className="mt-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="min-w-[12rem] flex-1">
                <label htmlFor="q" className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Patient name
                </label>
                <input
                  id="q"
                  name="q"
                  type="search"
                  defaultValue={qRaw}
                  placeholder="Search…"
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
              >
                Apply
              </button>
            </form>
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
              {allConsultations.length === 0 ? (
                <EmptyState
                  title="No consultation requests yet"
                  description="When admin assigns or schedules consultations for you, they will appear here."
                />
              ) : consultations.length === 0 ? (
                <EmptyState
                  title="No cases match filters"
                  description="Try another status or clear the patient search."
                />
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-950/50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-zinc-300">Patient</th>
                      <th className="px-4 py-3 font-medium text-zinc-300">Case</th>
                      <th className="px-4 py-3 font-medium text-zinc-300">Status</th>
                      <th className="px-4 py-3 font-medium text-zinc-300">Priority</th>
                      <th className="px-4 py-3 font-medium text-zinc-300">Next appointment</th>
                      <th className="px-4 py-3 font-medium text-zinc-300">Requested</th>
                      <th className="px-4 py-3 font-medium text-zinc-300">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map((c) => (
                      <tr key={c.id} className="border-b border-zinc-800">
                        <td className="px-4 py-3 text-zinc-200">{c.patient_name}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/specialist/cases/${c.id}`}
                            className="text-sm font-medium text-emerald-400 hover:underline"
                          >
                            Open
                          </Link>
                        </td>
                        <td className="px-4 py-3 capitalize text-zinc-300">{c.status}</td>
                        <td className="px-4 py-3 text-zinc-300">{c.case_priority}</td>
                        <td className="px-4 py-3 text-zinc-300">{formatNextAppointment(c)}</td>
                        <td className="px-4 py-3 text-zinc-400">
                          {c.requested_at ? new Date(c.requested_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/specialist/progress?lead_id=${encodeURIComponent(c.lead_id)}`}
                            className="text-sm font-medium text-emerald-600 hover:underline"
                          >
                            Update
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
