import Link from "next/link";
import { redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import { getHostByProfileId, listHostExperiences } from "@/lib/services/hosts.service";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import HostExperiencePublishedSwitch from "../HostExperiencePublishedSwitch";

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);
}

export default async function HostExperiencesListPage() {
  let profile;
  try {
    const ctx = await requireHost();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/host/experiences");
  }
  const host = await getHostByProfileId(profile.id);
  if (!host) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <AuthDashboardHeader title="Experiences" homeHref="/host" homeLabel="Host" maxWidth="max-w-5xl" navItems={[]} />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-sm text-zinc-300">Your account is not configured as a host.</p>
        </main>
      </div>
    );
  }
  const experiences = await listHostExperiences(host.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="Your experiences"
        homeHref="/host"
        homeLabel="Host"
        maxWidth="max-w-5xl"
        navItems={[{ href: "/host/experiences/new", label: "Add experience" }]}
      />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">Manage lodging and tourism add-ons you offer to patients.</p>
          <Link
            href="/host/experiences/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add experience
          </Link>
        </div>

        {experiences.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-400">
            No experiences yet.{" "}
            <Link href="/host/experiences/new" className="text-emerald-400 underline">
              Create your first
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {experiences.map((e) => (
                  <tr key={e.id} className="bg-zinc-950/40 hover:bg-zinc-900/50">
                    <td className="px-4 py-3 font-medium text-zinc-100">{e.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{e.category ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-300">
                      {e.base_price_cents != null ? money(e.base_price_cents) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{e.city ?? "—"}</td>
                    <td className="px-4 py-3">
                      <HostExperiencePublishedSwitch experienceId={e.id} initialPublished={e.published} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/host/experiences/${e.id}`} className="text-emerald-400 hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
