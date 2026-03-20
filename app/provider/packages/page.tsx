import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProviderManager } from "@/lib/auth";
import { getProviderDashboardData } from "@/lib/dashboard-data";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import PackagePublishedToggle from "./PackagePublishedToggle";

const NAV = [
  { href: "/provider", label: "Overview" },
  { href: "/provider/packages", label: "Packages", active: true as const },
  { href: "/provider/specialists", label: "Specialists" },
];

export default async function ProviderPackagesPage() {
  let profile;
  try {
    const ctx = await requireProviderManager();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/provider/packages");
  }
  const providerId = profile.provider_id;
  if (!providerId) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AuthDashboardHeader title="Packages" navItems={NAV} homeHref="/" homeLabel="Home" maxWidth="max-w-4xl" />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-zinc-600">Your account is not linked to a provider. Contact an admin.</p>
        </main>
      </div>
    );
  }
  const data = await getProviderDashboardData(providerId);
  const packages = data.packages as { id: string; slug: string; name: string; published: boolean }[];

  return (
    <div className="min-h-screen bg-zinc-50">
      <AuthDashboardHeader title="Your packages" navItems={NAV} homeHref="/" homeLabel="Home" maxWidth="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-sm text-zinc-600">
          Toggle visibility on the marketplace. Edit details per package.
        </p>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {packages.length === 0 ? (
            <p className="p-6 text-sm text-zinc-600">No packages assigned to your provider yet.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium text-right">Visibility</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">{pkg.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">{pkg.slug}</td>
                    <td className="px-4 py-3 text-right">
                      <PackagePublishedToggle packageId={pkg.id} initialPublished={pkg.published} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/provider/packages/${pkg.id}`}
                        className="text-sm font-medium text-emerald-700 hover:underline"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
