import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProviderManager } from "@/lib/auth";
import { getProviderDashboardData, getProviderOverviewMetrics } from "@/lib/dashboard-data";
import StatCard from "@/app/components/dashboard/StatCard";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import EmptyState from "@/app/components/ui/EmptyState";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";

const PROVIDER_NAV = [
  { href: "/provider", label: "Overview", active: true as const },
  { href: "/provider/packages", label: "Packages" },
  { href: "/provider/specialists", label: "Specialists" },
];

export default async function ProviderDashboardPage() {
  let profile;
  try {
    const ctx = await requireProviderManager();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/provider");
  }
  const providerId = profile.provider_id;
  if (!providerId) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AuthDashboardHeader
          title="Provider dashboard"
          navItems={PROVIDER_NAV}
          homeHref="/"
          homeLabel="Home"
          maxWidth="max-w-4xl"
        />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-zinc-600">Your account is not linked to a provider. Contact an admin.</p>
        </main>
      </div>
    );
  }
  const data = await getProviderDashboardData(providerId);
  const metrics = await getProviderOverviewMetrics(providerId);
  const provider = data.provider as { id: string; name: string; city: string; approval_status: string; published: boolean } | null;
  const bookings = data.bookings as { id: string; status: string; lead_id: string; package_id: string }[];
  const revenueUsd = (metrics.revenue_cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <AuthDashboardHeader
        title="Provider dashboard"
        navItems={PROVIDER_NAV}
        homeHref="/"
        homeLabel="Home"
        maxWidth="max-w-4xl"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <DashboardLayout
          title={provider?.name ?? "Provider"}
          description={provider?.city ? `Provider · ${provider.city}` : "Provider overview"}
        >
          <DashboardSection>
            <p className="mb-3 text-xs text-zinc-500">
              Metrics match{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 text-[10px]">GET /api/provider/overview</code> for integrations.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Packages" value={metrics.packages_count} href="/provider/packages" />
              <StatCard label="Specialists" value={metrics.specialists_count} href="/provider/specialists" />
              <StatCard label="Bookings" value={metrics.bookings_count} helper="all time" />
              <StatCard label="Revenue (paid)" value={revenueUsd} helper="succeeded payments · linked leads" />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/provider/packages"
                className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Manage packages
              </Link>
              <Link
                href="/provider/specialists"
                className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                View specialists
              </Link>
            </div>
          </DashboardSection>
          <DashboardSection title="Recent bookings">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {bookings.length === 0 ? (
                <EmptyState
                  title="No bookings yet"
                  description="When patients confirm and pay deposits for packages with your clinic, bookings will appear here."
                />
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Lead ID</th>
                      <th className="px-4 py-3 font-medium">Package ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 10).map((b) => (
                      <tr key={b.id} className="border-b border-zinc-100">
                        <td className="px-4 py-3">{b.status}</td>
                        <td className="px-4 py-3 font-mono text-xs">{b.lead_id.slice(0, 8)}…</td>
                        <td className="px-4 py-3 font-mono text-xs">{b.package_id.slice(0, 8)}…</td>
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
