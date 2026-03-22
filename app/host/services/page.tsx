import Link from "next/link";
import { redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import { getServerSupabase } from "@/lib/supabase/server";
import DashboardShellHeader from "@/app/components/dashboard/DashboardShellHeader";
import HostServiceActiveToggle from "./HostServiceActiveToggle";

function money(cents: number | null | undefined): string {
  const n = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return `$${(n / 100).toFixed(n % 100 === 0 ? 0 : 2)}`;
}

export default async function HostServicesPage() {
  let profile;
  try {
    const ctx = await requireHost();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/host/services");
  }

  const host = await getHostByProfileId(profile.id);
  if (!host) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8 text-zinc-300">
        <p>Host profile not found.</p>
      </div>
    );
  }

  const supabase = getServerSupabase();
  const { data: services } = await supabase
    .from("services")
    .select(
      "id, name, category, price_cents, price_per, city, is_active, created_at",
    )
    .eq("host_id", host.id)
    .order("created_at", { ascending: false });

  const rows = services ?? [];

  const mobileNav = [
    { href: "/host", icon: "▣", label: "Dashboard" },
    { href: "/host/services", icon: "🛎️", label: "Services", active: true },
    { href: "/host/experiences", icon: "✦", label: "Experiences" },
  ] as const;
  const desktopNav = [
    { href: "/host", label: "Dashboard" },
    { href: "/host/services", label: "Services", active: true },
    { href: "/host/experiences", label: "Experiences" },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardShellHeader subtitle={host.display_name} mobileNav={mobileNav} desktopNav={desktopNav} />

      <main className="mx-auto max-w-4xl space-y-6 px-3 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Your services</h1>
            <p className="text-sm text-zinc-400">Offerings visible on the patient marketplace when active.</p>
          </div>
          <Link
            href="/host/services/new"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Add service
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-400">
            No services yet.{" "}
            <Link href="/host/services/new" className="text-emerald-400 underline">
              Create one
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((s) => (
              <li
                key={s.id as string}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{s.name as string}</p>
                  <p className="text-xs text-zinc-500">
                    {(s.category as string) ?? "—"} · {money(s.price_cents as number)} / {(s.price_per as string) ?? "person"}
                    {s.city ? ` · ${s.city}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">Active</span>
                  <HostServiceActiveToggle serviceId={s.id as string} initialActive={Boolean(s.is_active)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
