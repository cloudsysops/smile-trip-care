import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAllSpecialists } from "@/lib/specialists";
import { getServerSupabase } from "@/lib/supabase/server";
import LinkEntityProfileButton from "@/app/admin/LinkEntityProfileButton";

export default async function AdminSpecialistsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/specialists");
  }
  const specialists = await getAllSpecialists();
  const supabase = getServerSupabase();
  const specialistIds = specialists.map((s) => s.id);
  const linkedProfilesBySpecialistId = new Map<string, { email: string | null }>();
  if (specialistIds.length > 0) {
    const { data: linkedProfiles } = await supabase
      .from("profiles")
      .select("specialist_id, email")
      .in("specialist_id", specialistIds)
      .eq("is_active", true);
    for (const profile of linkedProfiles ?? []) {
      if (profile.specialist_id) {
        linkedProfilesBySpecialistId.set(profile.specialist_id as string, {
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
            <Link href="/admin/providers" className="text-sm text-zinc-400 hover:underline">
              Providers
            </Link>
            <Link href="/admin/specialists" className="text-sm font-medium text-zinc-100 underline">
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
          <h1 className="text-xl font-semibold text-zinc-100">Admin — Specialists</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="mb-4 text-sm text-zinc-400">
          Only published + approved specialists appear on the public site.
        </p>
        {specialists.length === 0 ? (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 text-zinc-400">No specialists yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/40">
                  <th className="px-4 py-3 font-semibold text-zinc-400">Name</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Specialty</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">City</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Status</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Published</th>
                  <th className="px-4 py-3 font-semibold text-zinc-400">Profile link</th>
                </tr>
              </thead>
              <tbody>
                {specialists.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800">
                    <td className="px-4 py-3 font-medium text-zinc-100">{s.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.specialty}</td>
                    <td className="px-4 py-3 text-zinc-400">{s.city}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          s.approval_status === "approved"
                            ? "text-emerald-300"
                            : s.approval_status === "rejected" || s.approval_status === "suspended"
                              ? "text-red-300"
                              : "text-amber-300"
                        }
                      >
                        {s.approval_status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{s.published ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <LinkEntityProfileButton
                        entityId={s.id}
                        entityLabel="specialist"
                        endpoint={`/api/admin/specialists/${s.id}`}
                        currentLinkedEmail={linkedProfilesBySpecialistId.get(s.id)?.email ?? null}
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
