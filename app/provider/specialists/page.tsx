import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProviderManager } from "@/lib/auth";
import { getProviderDashboardData } from "@/lib/dashboard-data";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";

const NAV = [
  { href: "/provider", label: "Overview" },
  { href: "/provider/packages", label: "Packages" },
  { href: "/provider/specialists", label: "Specialists", active: true as const },
];

export default async function ProviderSpecialistsPage() {
  let profile;
  try {
    const ctx = await requireProviderManager();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/provider/specialists");
  }
  const providerId = profile.provider_id;
  if (!providerId) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AuthDashboardHeader title="Specialists" navItems={NAV} homeHref="/" homeLabel="Home" maxWidth="max-w-4xl" />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="text-zinc-600">Your account is not linked to a provider. Contact an admin.</p>
        </main>
      </div>
    );
  }
  const data = await getProviderDashboardData(providerId);
  const specialists = data.specialists as {
    id: string;
    name: string;
    specialty: string;
    approval_status: string;
    published: boolean;
  }[];

  return (
    <div className="min-h-screen bg-zinc-50">
      <AuthDashboardHeader title="Your specialists" navItems={NAV} homeHref="/" homeLabel="Home" maxWidth="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-sm text-zinc-600">
          Specialists linked to your clinic. Profile and approval changes are managed by admin.
        </p>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {specialists.length === 0 ? (
            <p className="p-6 text-sm text-zinc-600">No specialists assigned yet.</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Specialty</th>
                  <th className="px-4 py-3 font-medium">Approval</th>
                  <th className="px-4 py-3 font-medium">Catalog</th>
                </tr>
              </thead>
              <tbody>
                {specialists.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                    <td className="px-4 py-3 text-zinc-700">{s.specialty}</td>
                    <td className="px-4 py-3 text-zinc-600">{s.approval_status}</td>
                    <td className="px-4 py-3 text-zinc-600">{s.published ? "Published" : "Hidden"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Need changes?{" "}
          <Link href="/provider" className="text-emerald-700 hover:underline">
            Back to overview
          </Link>
        </p>
      </main>
    </div>
  );
}
