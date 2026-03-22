import { redirect } from "next/navigation";
import { requireSpecialist } from "@/lib/auth";
import { getSpecialistDashboardData, type SpecialistConsultationListRow } from "@/lib/dashboard-data";
import { specialistHonorificName } from "@/lib/display-names";
import DashboardShellHeader from "@/app/components/dashboard/DashboardShellHeader";
import { DashboardStatsRow } from "@/app/components/dashboard/DashboardStatsRow";
import StatusBadge from "@/app/components/ui/StatusBadge";
import CaseCard from "@/app/components/ui/CaseCard";
import { SpecialistPatientTable, SpecialistStatusDonut } from "./SpecialistWidgets";

function startOfWeekUTC(): Date {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function pct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

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
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-zinc-300">Your account is not linked to a specialist. Contact an admin.</p>
        </main>
      </div>
    );
  }
  const data = await getSpecialistDashboardData(specialistId);
  if (process.env.NODE_ENV === "development") {
    console.log("[specialist/page]", {
      profileId: profile.id,
      specialistId,
      consultationsLoaded: data.consultations.length,
      hasSpecialistRow: !!data.specialist,
    });
  }
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
  const now = new Date();
  const startWeek = startOfWeekUTC();
  const prevWeek = new Date(startWeek);
  prevWeek.setUTCDate(startWeek.getUTCDate() - 7);

  const pending = allConsultations.filter((c) => c.status === "requested" || c.status === "accepted");
  const active = allConsultations.filter((c) => c.status === "scheduled");
  const completed = allConsultations.filter((c) => c.status === "completed");
  const scheduledThisWeek = active.filter((c) => c.scheduled_at && new Date(c.scheduled_at) >= startWeek).length;
  const scheduledPrevWeek = active.filter((c) => c.scheduled_at && new Date(c.scheduled_at) >= prevWeek && new Date(c.scheduled_at) < startWeek).length;
  const requestedThisWeek = pending.filter((c) => c.requested_at && new Date(c.requested_at) >= startWeek).length;
  const requestedPrevWeek = pending.filter((c) => c.requested_at && new Date(c.requested_at) >= prevWeek && new Date(c.requested_at) < startWeek).length;

  const sparkSeedRaw = allConsultations
    .slice(0, 14)
    .reverse()
    .map((c, idx) => ({ day: `${idx + 1}`, value: c.status === "completed" ? 1 : c.status === "scheduled" ? 2 : 3 }));
  const sparkSeed = sparkSeedRaw;

  const todayCases = allConsultations.filter((c) => {
    const dt = c.scheduled_at ? new Date(c.scheduled_at) : c.requested_at ? new Date(c.requested_at) : null;
    if (!dt) return false;
    return dt.toDateString() === now.toDateString();
  });
  const recentActivity = allConsultations.slice(0, 6);
  const scheduledDates = active
    .map((c) => (c.scheduled_at ? new Date(c.scheduled_at) : null))
    .filter((d): d is Date => !!d)
    .slice(0, 20);
  const weeklyPreview = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = d.toDateString();
    const count = scheduledDates.filter((x) => x.toDateString() === key).length;
    return { label: d.toLocaleDateString(undefined, { weekday: "short" }), count };
  });
  const patientRows = allConsultations.map((c) => ({
    id: c.id,
    patient_name: c.patient_name,
    treatment: c.status === "scheduled" ? "Scheduled treatment" : "Consultation",
    status: c.status,
    last_update: c.scheduled_at ?? c.requested_at ?? null,
  }));

  const specialistMobileNav = [
    { href: "/specialist", icon: "▣", label: "Dashboard", active: true },
    { href: "/specialist", icon: "👥", label: "Patients" },
    { href: "/specialist", icon: "📅", label: "Schedule" },
    { href: "/specialist/availability", icon: "🕐", label: "Availability" },
  ] as const;
  const specialistDesktopNav = [
    { href: "/specialist", label: "Dashboard", active: true },
    { href: "/specialist", label: "Patients" },
    { href: "/specialist", label: "Schedule" },
    { href: "/specialist/availability", label: "Availability" },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardShellHeader
        subtitle={specialistHonorificName(specialist?.name)}
        mobileNav={specialistMobileNav}
        desktopNav={specialistDesktopNav}
      />

      <main className="mx-auto max-w-6xl space-y-4 px-3 py-6 sm:px-6 sm:py-8">
        <DashboardStatsRow
          cards={[
            { label: "Active patients", value: active.length + pending.length, trend: pct(active.length + pending.length, Math.max(1, completed.length)), spark: sparkSeed, accent: "#22d3ee" },
            { label: "New cases", value: pending.length, trend: pct(requestedThisWeek, Math.max(1, requestedPrevWeek)), spark: sparkSeed, accent: "#f59e0b" },
            { label: "Scheduled this week", value: scheduledThisWeek, trend: pct(scheduledThisWeek, Math.max(1, scheduledPrevWeek)), spark: sparkSeed, accent: "#10b981" },
            { label: "Completed total", value: completed.length, trend: pct(completed.length, Math.max(1, active.length)), spark: sparkSeed, accent: "#a78bfa" },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
          <section className="min-w-0 space-y-4">
            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Today&apos;s cases</h2>
              <div className="mt-3 space-y-3">
                {todayCases.length === 0 ? (
                  <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-xs text-zinc-400 sm:text-sm">
                    No cases today — enjoy your day 🎉
                  </p>
                ) : (
                  todayCases.map((c) => (
                    <CaseCard
                      key={c.id}
                      caseId={c.id}
                      patientName={c.patient_name}
                      treatment={c.status === "scheduled" ? "Treatment in progress" : "Consultation case"}
                      priority={c.case_priority || "normal"}
                      status={c.status}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Recent activity</h3>
              <ul className="mt-3 space-y-2">
                {recentActivity.length === 0 ? (
                  <li className="rounded-md border border-dashed border-zinc-700 bg-zinc-950/40 px-3 py-4 text-center text-xs text-zinc-500 sm:text-sm">
                    No recent activity yet.
                  </li>
                ) : (
                  recentActivity.map((c) => (
                    <li key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs transition-colors hover:bg-zinc-800/40 sm:text-sm">
                      <p className="text-zinc-100">{c.patient_name}</p>
                      <p className="text-[11px] text-zinc-400 sm:text-xs">
                        <StatusBadge label={c.status} variant={c.status === "requested" ? "warning" : c.status === "completed" ? "success" : "info"} />{" "}
                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : c.requested_at ? new Date(c.requested_at).toLocaleString() : "—"}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

          <section className="min-w-0 space-y-4">
            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Mini week calendar</h3>
              <div className="mt-3 grid grid-cols-7 gap-1 sm:gap-2">
                {weeklyPreview.map((d) => (
                  <div key={d.label} className="rounded-md border border-zinc-800 bg-zinc-950/60 p-1.5 text-center sm:p-2">
                    <p className="text-[10px] text-zinc-500 sm:text-[11px]">{d.label}</p>
                    <p className="text-sm font-semibold tabular-nums text-zinc-100 sm:text-lg">{d.count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Availability</h3>
              <p className="mt-2 text-xs text-zinc-300 sm:text-sm">
                Today: <span className="text-emerald-400">Available</span>
              </p>
              <p className="mt-1 text-[11px] text-zinc-400 sm:text-xs">Manage full schedule in Availability tab.</p>
            </div>

            <SpecialistStatusDonut
              data={[
                { name: "active", value: active.length },
                { name: "pending", value: pending.length },
                { name: "completed", value: completed.length },
              ]}
            />
          </section>
        </div>

        <SpecialistPatientTable rows={patientRows} />
      </main>
    </div>
  );
}
