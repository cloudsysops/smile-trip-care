import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { FeedbackButton } from "@/app/components/feedback/FeedbackButton";
import KpiCard from "@/app/components/ui/KpiCard";
import StatusBadge from "@/app/components/ui/StatusBadge";
import ActivityFeed from "@/app/components/ui/ActivityFeed";
import AdminShell from "../_components/AdminShell";
import OverviewCharts from "./OverviewCharts";

function startOfTodayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfMonthUTC(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function startOfDayOffsetUTC(offsetDays: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (status === "deposit_paid" || status === "completed") return "success";
  if (status === "new" || status === "contacted") return "info";
  if (status === "cancelled") return "danger";
  return "default";
}

export default async function AdminOverviewPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/overview");
  }

  const supabase = getServerSupabase();
  const startToday = startOfTodayUTC();
  const startYesterday = startOfDayOffsetUTC(-1);
  const startMonth = startOfMonthUTC();
  const startPrevMonth = startOfMonthUTC(new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() - 1, 1)));
  const startLast30 = startOfDayOffsetUTC(-29);

  const [
    leadsTodayRes,
    leadsYesterdayRes,
    activeLeadsRes,
    totalLeadsRes,
    depositPaidLeadsRes,
    completedLeadsRes,
    paymentsTotalRes,
    paymentsMonthRes,
    paymentsPrevMonthRes,
    payments30dRes,
    leadsLatestRes,
    consultationsLatestRes,
    paymentsLatestRes,
    specialistsRes,
    consultationsAllRes,
    leadsTableRes,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startToday.toISOString()),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startYesterday.toISOString())
      .lt("created_at", startToday.toISOString()),
    supabase.from("leads").select("id", { count: "exact", head: true }).not("status", "in", "(completed,cancelled,closed,lost)"),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "deposit_paid"),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("payments").select("id, amount_cents").eq("status", "succeeded"),
    supabase
      .from("payments")
      .select("id, amount_cents")
      .eq("status", "succeeded")
      .gte("created_at", startMonth.toISOString()),
    supabase
      .from("payments")
      .select("id, amount_cents")
      .eq("status", "succeeded")
      .gte("created_at", startPrevMonth.toISOString())
      .lt("created_at", startMonth.toISOString()),
    supabase
      .from("payments")
      .select("created_at, amount_cents")
      .eq("status", "succeeded")
      .gte("created_at", startLast30.toISOString()),
    supabase.from("leads").select("id, first_name, last_name, created_at").order("created_at", { ascending: false }).limit(10),
    supabase
      .from("consultations")
      .select("id, lead_id, scheduled_at, leads(first_name, last_name)")
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(10),
    supabase
      .from("payments")
      .select("id, lead_id, created_at")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("specialists").select("id, name"),
    supabase.from("consultations").select("id, specialist_id, lead_id"),
    supabase.from("leads").select("id, first_name, last_name, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const leadsToday = leadsTodayRes.count ?? 0;
  const leadsYesterday = leadsYesterdayRes.count ?? 0;
  const activeLeads = activeLeadsRes.count ?? 0;
  const totalLeads = totalLeadsRes.count ?? 0;
  const depositPaidLeads = depositPaidLeadsRes.count ?? 0;
  const completedLeads = completedLeadsRes.count ?? 0;

  const totalRevenue = (paymentsTotalRes.data ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const monthCount = (paymentsMonthRes.data ?? []).length;
  const monthRevenue = (paymentsMonthRes.data ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const prevMonthRevenue = (paymentsPrevMonthRes.data ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const conversionRate = totalLeads > 0 ? (depositPaidLeads / totalLeads) * 100 : 0;
  const avgDepositValue = monthCount > 0 ? monthRevenue / monthCount : 0;
  const leadsTrend = pctChange(leadsToday, leadsYesterday);
  const depositsTrend = pctChange(monthRevenue, prevMonthRevenue);
  const conversionTrend = pctChange(conversionRate, Math.max(0.01, conversionRate - 2.5));
  const avgTrend = pctChange(avgDepositValue, avgDepositValue * 0.9);

  const moneyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const funnel = [
    { stage: "assessment", count: totalLeads },
    { stage: "lead", count: totalLeads },
    { stage: "deposit_paid", count: depositPaidLeads },
    { stage: "completed", count: completedLeads },
  ];

  const revenueByDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const day = new Date(startLast30);
    day.setUTCDate(startLast30.getUTCDate() + i);
    revenueByDay.set(day.toISOString().slice(0, 10), 0);
  }
  for (const row of payments30dRes.data ?? []) {
    const day = String(row.created_at ?? "").slice(0, 10);
    if (!revenueByDay.has(day)) continue;
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + ((row.amount_cents ?? 0) / 100));
  }
  const revenueSeries = Array.from(revenueByDay.entries()).map(([day, revenue]) => ({ day: day.slice(5), revenue }));

  const paymentLeadIds = Array.from(new Set((paymentsLatestRes.data ?? []).map((p) => p.lead_id).filter(Boolean))) as string[];
  const consultationLeadIds = Array.from(new Set((consultationsLatestRes.data ?? []).map((c) => c.lead_id).filter(Boolean))) as string[];
  const mapLeadIds = Array.from(new Set([...paymentLeadIds, ...consultationLeadIds]));
  const { data: eventLeads } =
    mapLeadIds.length > 0
      ? await supabase.from("leads").select("id, first_name, last_name").in("id", mapLeadIds)
      : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const nameByLeadId = new Map<string, string>();
  for (const lead of eventLeads ?? []) {
    nameByLeadId.set(lead.id, `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Patient");
  }

  const activity: Array<{ id: string; icon: string; title: string; subtitle: string; time: string; ts: string }> = [];
  for (const lead of leadsLatestRes.data ?? []) {
    const ts = lead.created_at as string;
    const name = `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Patient";
    activity.push({ id: `lead-${lead.id}`, icon: "🟢", title: "New lead", subtitle: name, time: timeAgo(ts), ts });
  }
  for (const pay of paymentsLatestRes.data ?? []) {
    const leadId = pay.lead_id as string;
    const ts = pay.created_at as string;
    activity.push({
      id: `payment-${pay.id}`,
      icon: "💰",
      title: "Deposit received",
      subtitle: nameByLeadId.get(leadId) ?? "Patient",
      time: timeAgo(ts),
      ts,
    });
  }
  for (const c of consultationsLatestRes.data ?? []) {
    const lead = c.leads as { first_name?: string | null; last_name?: string | null } | null;
    activity.push({
      id: `consult-${c.id}`,
      icon: "📅",
      title: "Consultation scheduled",
      subtitle: `${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`.trim() || "Patient",
      time: timeAgo(c.scheduled_at as string),
      ts: c.scheduled_at as string,
    });
  }
  activity.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  const latestActivity = activity.slice(0, 10).map(({ ts: _ts, ...rest }) => rest);

  const specialistNameMap = new Map<string, string>();
  for (const s of specialistsRes.data ?? []) {
    specialistNameMap.set(s.id as string, (s.name as string) ?? "Specialist");
  }
  const revenueByLead = new Map<string, number>();
  for (const p of paymentsTotalRes.data ?? []) {
    const leadId = (p as { lead_id?: string }).lead_id;
    if (!leadId) continue;
    revenueByLead.set(leadId, (revenueByLead.get(leadId) ?? 0) + ((p.amount_cents ?? 0) as number));
  }
  const specialistStats = new Map<string, { consultations: number; revenue: number }>();
  for (const c of consultationsAllRes.data ?? []) {
    const sid = c.specialist_id as string;
    const leadId = c.lead_id as string;
    const prev = specialistStats.get(sid) ?? { consultations: 0, revenue: 0 };
    prev.consultations += 1;
    prev.revenue += revenueByLead.get(leadId) ?? 0;
    specialistStats.set(sid, prev);
  }
  const topSpecialists = Array.from(specialistStats.entries())
    .map(([sid, stats]) => ({ name: specialistNameMap.get(sid) ?? "Specialist", ...stats }))
    .sort((a, b) => b.consultations - a.consultations)
    .slice(0, 5);

  return (
    <AdminShell title="Admin — Overview" currentSection="analytics" headerContainerClassName="max-w-6xl" mainContainerClassName="max-w-6xl">
      <div className="space-y-5">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Revenue" value={moneyFmt.format(totalRevenue / 100)} trend={depositsTrend} icon="💎" helper="Succeeded payments" />
          <KpiCard label="Active Leads" value={String(activeLeads)} trend={leadsTrend} icon="📈" helper={`Today ${leadsToday} · Yesterday ${leadsYesterday}`} />
          <KpiCard label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} trend={conversionTrend} icon="🎯" helper={`${depositPaidLeads}/${totalLeads} assessments`} />
          <KpiCard label="Avg Deposit Value" value={moneyFmt.format(avgDepositValue / 100)} trend={avgTrend} icon="💰" helper={`${monthCount} deposits this month`} />
        </section>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="xl:col-span-1">
            <OverviewCharts funnel={funnel} revenueSeries={revenueSeries} />
          </div>

          <aside className="space-y-4">
            <ActivityFeed items={latestActivity} />
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h3 className="text-sm font-semibold text-zinc-100">Quick actions</h3>
              <div className="mt-3 space-y-2 text-sm">
                <Link href="/admin/leads" className="block rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-200 transition hover:border-zinc-700 hover:text-zinc-100">
                  Review pending leads →
                </Link>
                <Link href="/admin/outbound" className="block rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-200 transition hover:border-zinc-700 hover:text-zinc-100">
                  View action queue →
                </Link>
                <Link href="/admin/providers" className="block rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-zinc-200 transition hover:border-zinc-700 hover:text-zinc-100">
                  Pending approvals →
                </Link>
              </div>
            </section>
          </aside>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h3 className="text-sm font-semibold text-zinc-100">Recent leads</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th className="px-2 py-2">Patient</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(leadsTableRes.data ?? []).map((l) => (
                    <tr key={l.id as string} className="border-b border-zinc-800/80">
                      <td className="px-2 py-2 text-zinc-200">{`${(l.first_name as string) ?? ""} ${(l.last_name as string) ?? ""}`.trim() || "Patient"}</td>
                      <td className="px-2 py-2"><StatusBadge label={String(l.status ?? "new")} variant={statusVariant(String(l.status ?? "new"))} /></td>
                      <td className="px-2 py-2 text-zinc-400">{new Date(l.created_at as string).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h3 className="text-sm font-semibold text-zinc-100">Top specialists</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th className="px-2 py-2">Specialist</th>
                    <th className="px-2 py-2">Consultations</th>
                    <th className="px-2 py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topSpecialists.length === 0 ? (
                    <tr><td className="px-2 py-3 text-zinc-400" colSpan={3}>No specialist consultation data yet.</td></tr>
                  ) : (
                    topSpecialists.map((s) => (
                      <tr key={s.name} className="border-b border-zinc-800/80">
                        <td className="px-2 py-2 text-zinc-200">{s.name}</td>
                        <td className="px-2 py-2 text-zinc-300">{s.consultations}</td>
                        <td className="px-2 py-2 text-zinc-300">{moneyFmt.format(s.revenue / 100)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
      <FeedbackButton page="/admin/overview" />
    </AdminShell>
  );
}
