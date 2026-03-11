import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import StatCard from "@/app/components/dashboard/StatCard";
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

function startOfMonthUTC(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AdminOverviewPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/overview");
  }

  const supabase = getServerSupabase();
  const startOfToday = startOfTodayUTC();
  const startOfWeek = startOfWeekUTC();
  const startOfMonth = startOfMonthUTC();

  const [
    leadsTodayRes,
    leadsWeekRes,
    providersPendingRes,
    specialistsPendingRes,
    bookingsDepositRes,
    paymentsRes,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfToday),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", startOfWeek),
    supabase.from("providers").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
    supabase.from("specialists").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "deposit_paid"),
    supabase
      .from("payments")
      .select("amount_cents")
      .eq("status", "succeeded")
      .gte("created_at", startOfMonth),
  ]);

  const leadsToday = leadsTodayRes.count ?? 0;
  const leadsWeek = leadsWeekRes.count ?? 0;
  const providersPending = providersPendingRes.count ?? 0;
  const specialistsPending = specialistsPendingRes.count ?? 0;
  const pendingApproval = providersPending + specialistsPending;
  const bookingsDeposit = bookingsDepositRes.count ?? 0;
  const incomeCents =
    (paymentsRes.data ?? []).reduce((sum, row) => sum + (row.amount_cents ?? 0), 0);
  const incomeFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(incomeCents / 100);

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <nav className="flex flex-wrap items-center gap-3">
            <Link href="/admin/overview" className="text-sm font-medium text-zinc-900 underline">
              Overview
            </Link>
            <Link href="/admin/leads" className="text-sm text-zinc-600 hover:underline">
              Leads
            </Link>
            <Link href="/admin/providers" className="text-sm text-zinc-600 hover:underline">
              Providers
            </Link>
            <Link href="/admin/specialists" className="text-sm text-zinc-600 hover:underline">
              Specialists
            </Link>
            <Link href="/admin/experiences" className="text-sm text-zinc-600 hover:underline">
              Experiences
            </Link>
            <Link href="/admin/bookings" className="text-sm text-zinc-600 hover:underline">
              Bookings
            </Link>
            <Link href="/admin/consultations" className="text-sm text-zinc-600 hover:underline">
              Consultations
            </Link>
            <Link href="/admin/assets" className="text-sm text-zinc-600 hover:underline">
              Assets
            </Link>
          </nav>
          <h1 className="text-xl font-semibold">Admin</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <DashboardLayout
          title="Overview"
          description="High-level funnel and network metrics for the admin."
        >
          <DashboardSection>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Leads hoy"
                value={leadsToday}
                href="/admin/leads"
              />
              <StatCard
                label="Leads esta semana"
                value={leadsWeek}
                href="/admin/leads"
              />
              <StatCard
                label="Pendientes de aprobación"
                value={pendingApproval}
                helper={
                  <>
                    {providersPending} proveedores, {specialistsPending} especialistas
                  </>
                }
              />
              <StatCard
                label="Reservas con depósito"
                value={bookingsDeposit}
              />
              <StatCard
                label="Ingresos del mes"
                value={incomeFormatted}
              />
            </div>
          </DashboardSection>
        </DashboardLayout>
      </main>
    </div>
  );
}
