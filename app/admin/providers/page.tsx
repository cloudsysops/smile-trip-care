import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getProviders } from "@/lib/providers";
import { getServerSupabase } from "@/lib/supabase/server";
import LinkEntityProfileButton from "@/app/admin/LinkEntityProfileButton";

export default async function AdminProvidersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/providers");
  }
  const providers = await getProviders();
  const supabase = getServerSupabase();
  const providerIds = providers.map((p) => p.id);
  const linkedProfilesByProviderId = new Map<string, { email: string | null }>();
  if (providerIds.length > 0) {
    const { data: linkedProfiles } = await supabase
      .from("profiles")
      .select("provider_id, email")
      .in("provider_id", providerIds)
      .eq("is_active", true);
    for (const profile of linkedProfiles ?? []) {
      if (profile.provider_id) {
        linkedProfilesByProviderId.set(profile.provider_id as string, {
          email: (profile.email as string | null) ?? null,
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <nav className="flex flex-wrap items-center gap-3">
            <Link href="/admin/overview" className="text-sm text-zinc-400 hover:underline">
              Overview
            </Link>
            <Link href="/admin/leads" className="text-sm text-zinc-400 hover:underline">
              Leads
            </Link>
            <Link href="/admin/providers" className="text-sm font-medium text-zinc-100 underline">
              Providers
            </Link>
            <Link href="/admin/specialists" className="text-sm text-zinc-400 hover:underline">
              Specialists
            </Link>
            <Link href="/admin/experiences" className="text-sm text-zinc-400 hover:underline">
              Experiences
            </Link>
            <Link href="/admin/bookings" className="text-sm text-zinc-400 hover:underline">
              Bookings
            </Link>
            <Link href="/admin/consultations" className="text-sm text-zinc-400 hover:underline">
              Consultations
            </Link>
            <Link href="/admin/assets" className="text-sm text-zinc-400 hover:underline">
              Assets
            </Link>
          </nav>
          <h1 className="text-xl font-semibold text-zinc-100">Admin — Providers</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="mb-4 text-sm text-zinc-400">
          Curated network. Only admins create and approve providers. No public signup.
        </p>
        {providers.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 text-zinc-400">No providers yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="px-4 py-3 font-semibold text-zinc-400">Name</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Type</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">City</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Status</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Published</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Profile link</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800">
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-100">{p.name}</span>
                      {p.slug && <span className="ml-1 text-zinc-400">({p.slug})</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.provider_type ?? p.type ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{p.city}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.approval_status === "approved"
                            ? "text-emerald-300"
                            : p.approval_status === "rejected" || p.approval_status === "suspended"
                              ? "text-red-300"
                              : "text-amber-300"
                        }
                      >
                        {p.approval_status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{p.published ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <LinkEntityProfileButton
                        entityId={p.id}
                        entityLabel="provider"
                        endpoint={`/api/admin/providers/${p.id}`}
                        currentLinkedEmail={linkedProfilesByProviderId.get(p.id)?.email ?? null}
                      />
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
