import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import AdminStatCard from "@/app/admin/_components/AdminStatCard";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import { FeedbackButton } from "@/app/components/feedback/FeedbackButton";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="Admin"
        homeHref="/"
        homeLabel="Home"
        maxWidth="max-w-4xl"
        navItems={[
          { href: "/admin/overview", label: "Overview", active: true },
          { href: "/admin/leads", label: "Leads" },
          { href: "/admin/providers", label: "Providers" },
          { href: "/admin/specialists", label: "Specialists" },
          { href: "/admin/experiences", label: "Experiences" },
          { href: "/admin/bookings", label: "Bookings" },
          { href: "/admin/consultations", label: "Consultations" },
          { href: "/admin/assets", label: "Assets" },
        ]}
      />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <DashboardLayout
          title="Overview"
          description="High-level funnel and network metrics for the admin."
        >
          <DashboardSection>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminStatCard
                label="Leads hoy"
                value={leadsToday}
                href="/admin/leads"
              />
              <AdminStatCard
                label="Leads esta semana"
                value={leadsWeek}
                href="/admin/leads"
              />
              <AdminStatCard
                label="Pendientes de aprobación"
                value={pendingApproval}
                helper={
                  <>
                    {providersPending} proveedores, {specialistsPending} especialistas
                  </>
                }
              />
              <AdminStatCard
                label="Reservas con depósito"
                value={bookingsDeposit}
              />
              <AdminStatCard
                label="Ingresos del mes"
                value={incomeFormatted}
              />
            </div>
          </DashboardSection>
        </DashboardLayout>
      </main>
      <FeedbackButton page="/admin/overview" />
    </div>
  );
}
