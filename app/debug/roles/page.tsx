import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { getProfileRoles } from "@/lib/services/profile-roles.service";
import { getHostByProfileId } from "@/lib/services/hosts.service";

type ProfileRow = {
  id: string;
  email: string | null;
  role: string;
  is_active: boolean | null;
  provider_id: string | null;
  specialist_id: string | null;
  created_at: string | null;
};

export default async function DebugRolesPage() {
  const profile = await requireAdmin().catch(() => null);
  if (!profile) {
    redirect("/login");
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, is_active, provider_id, specialist_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Debug / Roles</h1>
        <p className="text-sm text-red-400">
          Failed to load profiles. Check Supabase connection and RLS.
        </p>
      </div>
    );
  }

  const profiles = data as ProfileRow[];

  const rolesByProfileId = new Map<string, Awaited<ReturnType<typeof getProfileRoles>>>();
  const hostsByProfileId = new Map<string, Awaited<ReturnType<typeof getHostByProfileId>>>();
  for (const p of profiles) {
    const roles = await getProfileRoles(p.id);
    rolesByProfileId.set(p.id, roles);
    const host = await getHostByProfileId(p.id);
    hostsByProfileId.set(p.id, host);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Debug / Roles</h1>
          <p className="text-sm text-zinc-400">
            Internal QA panel (read-only) for inspecting profiles and role assignments. Admin
            only.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Profiles
            </h2>
            <p className="text-xs text-zinc-500">
              Showing latest {profiles.length} profiles ordered by creation time.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Multi-roles</th>
                  <th className="px-3 py-2">Active</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Specialist</th>
                  <th className="px-3 py-2">Host</th>
                  <th className="px-3 py-2">Created at</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-900/80 hover:bg-zinc-800/40"
                  >
                    <td className="max-w-[220px] truncate px-3 py-2 text-xs text-zinc-400">
                      {p.id}
                    </td>
                    <td className="px-3 py-2 text-sm">{p.email ?? "—"}</td>
                    <td className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">
                      <span
                        className={
                          p.role === "admin"
                            ? "rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300"
                            : "rounded-full bg-zinc-700/40 px-2 py-1 text-zinc-200"
                        }
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-300">
                      {(() => {
                        const roles = rolesByProfileId.get(p.id) ?? [];
                        if (!roles.length) return "—";
                        return roles
                          .filter((r) => r.is_active)
                          .map((r) => r.role)
                          .join(", ");
                      })()}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {p.is_active ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
                          active
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-700/40 px-2 py-1 text-zinc-400">
                          inactive
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-400">
                      {p.provider_id ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-400">
                      {p.specialist_id ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-400">
                      {(() => {
                        const host = hostsByProfileId.get(p.id);
                        if (!host) return "—";
                        return host.is_active ? "host active" : "host inactive";
                      })()}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-400">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Admin SQL (manual role management)
          </h2>
          <p className="mb-3 text-xs text-zinc-400">
            This panel is read-only. To promote a user to admin for QA, use the documented SQL in
            <code className="mx-1 rounded bg-zinc-800 px-1 py-0.5 text-[10px]">
              docs/QA_ADMIN_ACCESS_SETUP.md
            </code>
            in Supabase SQL Editor. Do not run ad-hoc updates without logging them.
          </p>
        </section>
      </div>
    </div>
  );
}

