import Link from "next/link";
import { redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import DashboardShellHeader from "@/app/components/dashboard/DashboardShellHeader";
import { DashboardStatsRow } from "@/app/components/dashboard/DashboardStatsRow";
import {
  getHostByProfileId,
  getHostDashboardStats,
  listHostExperiences,
} from "@/lib/services/hosts.service";
import HostExperiencePublishedSwitch from "./HostExperiencePublishedSwitch";
import HostProfileEditor from "./HostProfileEditor";
import StripeConnectButton from "./StripeConnectButton";

function moneyFmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const sparkSeed = Array.from({ length: 14 }).map((_, i) => ({
  day: `${i + 1}`,
  value: (i % 3) + 1,
}));

export default async function HostDashboardPage() {
  let profile;
  try {
    const ctx = await requireHost();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/host");
  }

  const host = await getHostByProfileId(profile.id);
  if (!host) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-zinc-300">
            Your account is not configured as a host. Contact an admin if you should have host access.
          </p>
        </main>
      </div>
    );
  }

  const [stats, experiences] = await Promise.all([
    getHostDashboardStats(host.id),
    listHostExperiences(host.id),
  ]);

  const payoutStatusLabel = host.stripe_onboarding_complete
    ? "Ready for payouts"
    : host.stripe_details_submitted
      ? "Pending Stripe verification"
      : "Not connected";

  const payoutStatusTone =
    host.stripe_onboarding_complete
      ? "border-emerald-500/60 text-emerald-300 bg-emerald-500/10"
      : host.stripe_details_submitted
        ? "border-amber-500/60 text-amber-300 bg-amber-500/10"
        : "border-zinc-700 text-zinc-300 bg-zinc-900";

  const hostMobileNav = [
    { href: "/host", icon: "▣", label: "Dashboard", active: true },
    { href: "/host/services", icon: "🛎️", label: "Services" },
    { href: "/host/experiences", icon: "✦", label: "Experiences" },
    { href: "/host/bookings", icon: "📋", label: "Bookings" },
  ] as const;
  const hostDesktopNav = [
    { href: "/host", label: "Dashboard", active: true },
    { href: "/host/services", label: "Services" },
    { href: "/host/experiences", label: "Experiences" },
    { href: "/host/bookings", label: "Bookings" },
  ] as const;

  const revDisplay = moneyFmt(stats.revenue_cents);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardShellHeader subtitle={host.display_name} mobileNav={hostMobileNav} desktopNav={hostDesktopNav} />

      <main className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:px-6 sm:py-8">
        <DashboardStatsRow
          cards={[
            {
              label: "Experiences",
              value: stats.active_experiences,
              trend: 0,
              spark: sparkSeed,
              accent: "#10b981",
            },
            {
              label: "Active bookings",
              value: stats.active_bookings,
              trend: 0,
              spark: sparkSeed,
              accent: "#22d3ee",
            },
            {
              label: "Revenue",
              value: stats.revenue_cents,
              displayValue: revDisplay,
              trend: 0,
              spark: sparkSeed,
              accent: "#34d399",
            },
            {
              label: "Rating",
              value: 0,
              displayValue: "New",
              trend: 0,
              spark: sparkSeed,
              accent: "#a78bfa",
            },
          ]}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/host/services"
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
          >
            Manage services
          </Link>
          <Link
            href="/host/experiences/new"
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
          >
            Add experience
          </Link>
          <Link
            href="/host/bookings"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800/60"
          >
            View bookings
          </Link>
          <Link
            href="/host/experiences"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800/60"
          >
            Manage all experiences
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Host profile</h2>
            <p className="mt-1 text-sm text-zinc-500">Visible to coordinators and on marketplace context.</p>
            <HostProfileEditor
              initial={{
                display_name: host.display_name,
                city: host.city,
                bio: host.bio,
                phone: host.phone,
                whatsapp: host.whatsapp,
              }}
            />
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Stripe Connect</h2>
                <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${payoutStatusTone}`}>
                  {payoutStatusLabel}
                </p>
                <p className="mt-3 text-xs text-zinc-500">
                  Connect your account to receive payouts for experiences included in patient packages.
                </p>
              </div>
              <StripeConnectButton disabled={!!host.stripe_onboarding_complete} />
            </div>
          </section>
        </div>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Your experiences</h2>
            <Link href="/host/experiences/new" className="text-sm text-emerald-400 hover:underline">
              + Add
            </Link>
          </div>
          {experiences.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-400">
              No experiences yet.{" "}
              <Link href="/host/experiences/new" className="text-emerald-400 underline">
                Create one
              </Link>
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {experiences.map((e) => (
                <article
                  key={e.id}
                  className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:bg-zinc-800/60 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-zinc-100">{e.name}</h3>
                      <p className="mt-1 text-xs text-zinc-500">{e.city ?? "—"}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                      {e.category ?? "other"}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold tabular-nums text-white">
                    {e.base_price_cents != null ? moneyFmt(e.base_price_cents) : "—"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Live</span>
                      <HostExperiencePublishedSwitch experienceId={e.id} initialPublished={e.published} />
                    </div>
                    <Link href={`/host/experiences/${e.id}`} className="text-sm font-medium text-emerald-400 hover:underline">
                      Edit
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
