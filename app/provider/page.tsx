import { redirect } from "next/navigation";
import { requireProviderManager } from "@/lib/auth";
import { getProviderDashboardData } from "@/lib/dashboard-data";
import StatCard from "@/app/components/dashboard/StatCard";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import EmptyState from "@/app/components/ui/EmptyState";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";

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
          navItems={[{ href: "/provider", label: "Overview", active: true }]}
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
  const provider = data.provider as { id: string; name: string; city: string; approval_status: string; published: boolean } | null;
  const packages = data.packages as { id: string; slug: string; name: string; published: boolean }[];
  const specialists = data.specialists as { id: string; name: string; specialty: string; approval_status: string; published: boolean }[];
  const experiences = data.experiences as { id: string; name: string; city: string; published: boolean }[];
  const bookings = data.bookings as { id: string; status: string; lead_id: string; package_id: string }[];

  return (
    <div className="min-h-screen bg-zinc-50">
      <AuthDashboardHeader
        title="Provider dashboard"
        navItems={[{ href: "/provider", label: "Overview", active: true }]}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Packages" value={packages.length} />
              <StatCard label="Specialists" value={specialists.length} />
              <StatCard label="Experiences" value={experiences.length} />
              <StatCard label="Recent bookings" value={bookings.length} helper="last 20" />
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
