import Link from "next/link";
import { redirect } from "next/navigation";
import { getEffectiveRoleForProfile, requireSpecialist, type ProfileRole } from "@/lib/auth";
import { getProfileRoles } from "@/lib/services/roles.service";
import { getSpecialistDashboardData, type SpecialistConsultationListRow } from "@/lib/dashboard-data";
import RoleSwitcher from "@/app/components/dashboard/RoleSwitcher";
import StatusBadge from "@/app/components/ui/StatusBadge";
import CaseCard from "@/app/components/ui/CaseCard";
import { SpecialistPatientTable, SpecialistStatsRow, SpecialistStatusDonut } from "./SpecialistWidgets";

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
  const roleRows = await getProfileRoles(profile.id);
  const activeRole = await getEffectiveRoleForProfile(profile);
  const roles = roleRows
    .map((r) => r.role)
    .filter(
      (r): r is ProfileRole =>
        r === "admin" || r === "coordinator" || r === "provider_manager" || r === "host" || r === "specialist" || r === "patient" || r === "user",
    );

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

  const sparkSeed = allConsultations
    .slice(0, 14)
    .reverse()
    .map((c, idx) => ({ day: `${idx + 1}`, value: c.status === "completed" ? 1 : c.status === "scheduled" ? 2 : 3 }));

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold tracking-wide text-emerald-300">SMILETRIPCARE</Link>
            <p className="text-sm text-zinc-300">Dr. {specialist?.name ?? "Specialist"}</p>
            <nav className="hidden items-center gap-3 md:flex">
              <Link href="/specialist" className="text-sm font-medium text-zinc-100 underline">Dashboard</Link>
              <Link href="/specialist" className="text-sm text-zinc-400 hover:text-zinc-200">Patients</Link>
              <Link href="/specialist" className="text-sm text-zinc-400 hover:text-zinc-200">Schedule</Link>
              <Link href="/specialist/availability" className="text-sm text-zinc-400 hover:text-zinc-200">Availability</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-full border border-zinc-700 p-2 text-zinc-300">🔔</button>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200">
              {(profile.full_name?.[0] ?? profile.email?.[0] ?? "S").toUpperCase()}
            </span>
            <RoleSwitcher availableRoles={roles} activeRole={activeRole} />
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-200">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <SpecialistStatsRow
          cards={[
            { label: "Active patients", value: active.length + pending.length, trend: pct(active.length + pending.length, Math.max(1, completed.length)), spark: sparkSeed, accent: "#22d3ee" },
            { label: "New cases", value: pending.length, trend: pct(requestedThisWeek, Math.max(1, requestedPrevWeek)), spark: sparkSeed, accent: "#f59e0b" },
            { label: "Scheduled this week", value: scheduledThisWeek, trend: pct(scheduledThisWeek, Math.max(1, scheduledPrevWeek)), spark: sparkSeed, accent: "#10b981" },
            { label: "Completed total", value: completed.length, trend: pct(completed.length, Math.max(1, active.length)), spark: sparkSeed, accent: "#a78bfa" },
          ]}
        />

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">Today&apos;s cases</h2>
              <div className="mt-3 space-y-3">
                {todayCases.length === 0 ? (
                  <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-4 text-sm text-zinc-400">
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

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Recent activity</h3>
              <ul className="mt-3 space-y-2">
                {recentActivity.map((c) => (
                  <li key={c.id} className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm">
                    <p className="text-zinc-200">{c.patient_name}</p>
                    <p className="text-xs text-zinc-400">
                      <StatusBadge label={c.status} variant={c.status === "requested" ? "warning" : c.status === "completed" ? "success" : "info"} />{" "}
                      {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : c.requested_at ? new Date(c.requested_at).toLocaleString() : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Mini week calendar</h3>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {weeklyPreview.map((d) => (
                  <div key={d.label} className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2 text-center">
                    <p className="text-[11px] text-zinc-500">{d.label}</p>
                    <p className="text-lg font-semibold text-zinc-100">{d.count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Availability</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Today: <span className="text-emerald-400">Available</span>
              </p>
              <p className="mt-1 text-xs text-zinc-400">Manage full schedule in Availability tab.</p>
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
