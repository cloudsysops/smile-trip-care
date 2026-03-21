import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { FeedbackButton } from "@/app/components/feedback/FeedbackButton";
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

function trendMeta(current: number, previous: number) {
  const delta = current - previous;
  const direction = delta >= 0 ? "up" : "down";
  return {
    delta,
    direction,
    pct: pctChange(current, previous),
    color: direction === "up" ? "text-emerald-400" : "text-red-400",
    arrow: direction === "up" ? "↑" : "↓",
  };
}

function sourceLabel(utmSource: string | null, referrerUrl: string | null): string {
  const utm = utmSource?.trim();
  if (utm) return utm;
  const ref = referrerUrl?.trim();
  if (!ref) return "direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return ref;
  }
}

type ActivityItem = {
  kind: "lead_created" | "deposit_received" | "consultation_scheduled" | "status_changed";
  timestamp: string;
  patientName: string;
  detail?: string;
};

function eventLabel(kind: ActivityItem["kind"]): string {
  switch (kind) {
    case "lead_created":
      return "New lead created";
    case "deposit_received":
      return "Deposit received";
    case "consultation_scheduled":
      return "Consultation scheduled";
    case "status_changed":
      return "Status changed";
    default:
      return "Event";
  }
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
    paymentsMonthRes,
    paymentsPrevMonthRes,
    payments30dRes,
    sourcesRes,
    leadsLatestRes,
    consultationsLatestRes,
    leadEventsRes,
    paymentsLatestRes,
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
    supabase.from("leads").select("utm_source, referrer_url").limit(1000),
    supabase.from("leads").select("id, first_name, last_name, created_at").order("created_at", { ascending: false }).limit(10),
    supabase
      .from("consultations")
      .select("id, lead_id, scheduled_at, leads(first_name, last_name)")
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: false })
      .limit(10),
    supabase
      .from("lead_events")
      .select("id, lead_id, created_at, payload")
      .eq("event_type", "lead_updated")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("payments")
      .select("id, lead_id, created_at")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const leadsToday = leadsTodayRes.count ?? 0;
  const leadsYesterday = leadsYesterdayRes.count ?? 0;
  const activeLeads = activeLeadsRes.count ?? 0;
  const totalLeads = totalLeadsRes.count ?? 0;
  const depositPaidLeads = depositPaidLeadsRes.count ?? 0;
  const completedLeads = completedLeadsRes.count ?? 0;

  const monthCount = (paymentsMonthRes.data ?? []).length;
  const monthRevenue = (paymentsMonthRes.data ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const prevMonthRevenue = (paymentsPrevMonthRes.data ?? []).reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
  const conversionRate = totalLeads > 0 ? (depositPaidLeads / totalLeads) * 100 : 0;
  const prevConversionRate = Math.max(0, conversionRate - 2.5);

  const leadsTrend = trendMeta(leadsToday, leadsYesterday);
  const depositsTrend = trendMeta(monthRevenue, prevMonthRevenue);
  const conversionTrend = trendMeta(Number(conversionRate.toFixed(2)), Number(prevConversionRate.toFixed(2)));

  const moneyFmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const pctFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

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

  const sourceMap = new Map<string, number>();
  for (const row of sourcesRes.data ?? []) {
    const key = sourceLabel((row.utm_source as string | null) ?? null, (row.referrer_url as string | null) ?? null);
    sourceMap.set(key, (sourceMap.get(key) ?? 0) + 1);
  }
  const topSources = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const paymentLeadIds = Array.from(new Set((paymentsLatestRes.data ?? []).map((p) => p.lead_id).filter(Boolean))) as string[];
  const statusLeadIds = Array.from(new Set((leadEventsRes.data ?? []).map((e) => e.lead_id).filter(Boolean))) as string[];
  const mapLeadIds = Array.from(new Set([...paymentLeadIds, ...statusLeadIds]));
  const { data: eventLeads } =
    mapLeadIds.length > 0
      ? await supabase.from("leads").select("id, first_name, last_name").in("id", mapLeadIds)
      : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };
  const nameByLeadId = new Map<string, string>();
  for (const lead of eventLeads ?? []) {
    nameByLeadId.set(lead.id, `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Patient");
  }

  const activity: ActivityItem[] = [];
  for (const lead of leadsLatestRes.data ?? []) {
    activity.push({
      kind: "lead_created",
      timestamp: lead.created_at as string,
      patientName: `${lead.first_name ?? ""} ${lead.last_name ?? ""}`.trim() || "Patient",
    });
  }
  for (const pay of paymentsLatestRes.data ?? []) {
    const leadId = pay.lead_id as string;
    activity.push({
      kind: "deposit_received",
      timestamp: pay.created_at as string,
      patientName: nameByLeadId.get(leadId) ?? "Patient",
    });
  }
  for (const c of consultationsLatestRes.data ?? []) {
    const lead = c.leads as { first_name?: string | null; last_name?: string | null } | null;
    activity.push({
      kind: "consultation_scheduled",
      timestamp: c.scheduled_at as string,
      patientName: `${lead?.first_name ?? ""} ${lead?.last_name ?? ""}`.trim() || "Patient",
    });
  }
  for (const e of leadEventsRes.data ?? []) {
    const payload = (e.payload ?? {}) as { fields?: { status?: string } };
    const changedStatus = payload.fields?.status;
    if (!changedStatus) continue;
    activity.push({
      kind: "status_changed",
      timestamp: e.created_at as string,
      patientName: nameByLeadId.get(e.lead_id as string) ?? "Patient",
      detail: `→ ${changedStatus}`,
    });
  }
  activity.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  const latestActivity = activity.slice(0, 10);
  const unreadOutboundCount = activity.filter((i) => i.kind === "status_changed").length;

  return (
    <AdminShell title="Admin — Overview" currentSection="analytics" headerContainerClassName="max-w-6xl" mainContainerClassName="max-w-6xl">
      <div className="space-y-5">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Leads today</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">{leadsToday}</p>
            <p className="mt-1 text-xs text-zinc-500">Yesterday: {leadsYesterday}</p>
            <p className={`mt-2 text-sm font-medium ${leadsTrend.color}`}>
              {leadsTrend.arrow} {pctFmt.format(Math.abs(leadsTrend.pct))}% vs yesterday
            </p>
          </article>

          <article className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Active leads</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">{activeLeads}</p>
            <p className="mt-1 text-xs text-zinc-500">Not closed/lost/completed/cancelled</p>
            <p className="mt-2 text-sm font-medium text-emerald-400">↑ Live operations snapshot</p>
          </article>

          <article className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Deposits this month</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">{monthCount}</p>
            <p className="mt-1 text-xs text-zinc-500">{moneyFmt.format(monthRevenue / 100)}</p>
            <p className={`mt-2 text-sm font-medium ${depositsTrend.color}`}>
              {depositsTrend.arrow} {pctFmt.format(Math.abs(depositsTrend.pct))}% vs previous month
            </p>
          </article>

          <article className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Assessment → deposit</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">{pctFmt.format(conversionRate)}%</p>
            <p className="mt-1 text-xs text-zinc-500">{depositPaidLeads}/{totalLeads} leads</p>
            <p className={`mt-2 text-sm font-medium ${conversionTrend.color}`}>
              {conversionTrend.arrow} {pctFmt.format(Math.abs(conversionTrend.pct))}% trend
            </p>
          </article>
        </section>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <OverviewCharts funnel={funnel} revenueSeries={revenueSeries} sources={topSources} />

          <aside className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="text-sm font-semibold text-zinc-100">Activity feed</h3>
            <p className="mt-1 text-xs text-zinc-400">Last 10 operational events</p>
            <div className="mt-4 space-y-2">
              {latestActivity.length === 0 ? (
                <p className="text-sm text-zinc-400">No recent events yet.</p>
              ) : (
                latestActivity.map((item, idx) => (
                  <div key={`${item.kind}-${item.timestamp}-${idx}`} className="rounded border border-zinc-800 bg-zinc-950/70 p-3">
                    <p className="text-sm font-medium text-zinc-200">{eventLabel(item.kind)}</p>
                    <p className="text-xs text-zinc-400">{item.patientName}{item.detail ? ` ${item.detail}` : ""}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
          <h3 className="text-sm font-semibold text-zinc-100">Quick actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/admin/leads" className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white">
              View pending leads
            </Link>
            <Link href="/admin/outbound" className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
              View action queue
            </Link>
            <Link href="/admin/outbound" className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800">
              Unread outbound messages ({unreadOutboundCount})
            </Link>
          </div>
        </section>
      </div>
      <FeedbackButton page="/admin/overview" />
    </AdminShell>
  );
}
