import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import AdminShell from "../_components/AdminShell";
import AnalyticsCharts from "./AnalyticsCharts";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";

function startOfTodayUTC(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekUTC(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export type AnalyticsMetrics = {
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  highPriorityLeads: number;
  packagesRequested: number;
  assessmentCompletionRate: number; // 0-100, % with package_slug
  leadsByCountry: Array<{ country: string; count: number }>;
};

export default async function AdminAnalyticsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/analytics");
  }

  const supabase = getServerSupabase();
  const startOfToday = startOfTodayUTC();
  const startOfWeek = startOfWeekUTC();

  const [
    totalRes,
    todayRes,
    weekRes,
    highPriorityRes,
    packagesRes,
    withPackageRes,
    countryRes,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfToday),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .or("package_slug.not.is.null,budget_range.not.is.null"),
    supabase.from("leads").select("id", { count: "exact", head: true }).not("package_slug", "is", null),
    supabase.from("leads").select("id").not("package_slug", "is", null),
    supabase.from("leads").select("country").not("country", "is", null),
  ]);

  const totalLeads = totalRes.count ?? 0;
  const withPackage = (withPackageRes.data ?? []).length;
  const assessmentCompletionRate = totalLeads > 0 ? Math.round((withPackage / totalLeads) * 100) : 0;

  const countryMap = new Map<string, number>();
  for (const row of countryRes.data ?? []) {
    const c = (row.country as string)?.trim() || "Unknown";
    countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
  }
  const leadsByCountry = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const metrics: AnalyticsMetrics = {
    totalLeads,
    leadsToday: todayRes.count ?? 0,
    leadsThisWeek: weekRes.count ?? 0,
    highPriorityLeads: highPriorityRes.count ?? 0,
    packagesRequested: packagesRes.count ?? 0,
    assessmentCompletionRate,
    leadsByCountry,
  };

  return (
    <AdminShell title="Analytics" currentSection="analytics" mainContainerClassName="max-w-4xl">
      <DashboardLayout
        title="Analytics"
        description="Lightweight conversion dashboard. Use these metrics to see what’s working."
      >
        <DashboardSection>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Total leads</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{metrics.totalLeads}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Leads today</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{metrics.leadsToday}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Leads this week</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{metrics.leadsThisWeek}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">High priority leads</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{metrics.highPriorityLeads}</p>
              <p className="mt-1 text-xs text-zinc-400">Has package or budget</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Packages requested</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{metrics.packagesRequested}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
              <p className="text-sm font-medium text-zinc-400">Assessment → package interest</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{metrics.assessmentCompletionRate}%</p>
              <p className="mt-1 text-xs text-zinc-400">Leads with a package selected</p>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection>
          <AnalyticsCharts leadsByCountry={metrics.leadsByCountry} />
        </DashboardSection>

        <DashboardSection className="pt-2">
          <p className="text-xs text-zinc-400">
            <Link href="/admin/leads" className="underline hover:no-underline">
              View leads
            </Link>
            {" · "}
            <Link href="/admin/overview" className="underline hover:no-underline">
              Overview
            </Link>
          </p>
        </DashboardSection>
      </DashboardLayout>
    </AdminShell>
  );
}
