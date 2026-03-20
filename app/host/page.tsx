import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import StripeConnectButton from "./StripeConnectButton";

export default async function HostDashboardPage() {
  const ctx = await getCurrentProfile();
  if (!ctx) {
    redirect("/login?next=/host");
  }
  const host = await getHostByProfileId(ctx.profile.id);
  if (!host) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <AuthDashboardHeader title="Host dashboard" homeHref="/" homeLabel="Home" maxWidth="max-w-3xl" navItems={[]} />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-zinc-300">
            Your account is not configured as a host. Contact an admin if you should have host access.
          </p>
        </main>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <AuthDashboardHeader title="Host dashboard" homeHref="/" homeLabel="Home" maxWidth="max-w-5xl" navItems={[]} />

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Host profile</p>
            <p className="mt-2 text-lg font-semibold">{host.display_name}</p>
            {host.city ? <p className="mt-1 text-sm text-zinc-400">{host.city}</p> : null}
            <p className="mt-3 text-xs text-zinc-500">
              Stripe Connect status controls whether you can receive automated payouts in the future. Manual payouts
              continue to work even if Stripe is not connected yet.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payout setup</p>
                <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${payoutStatusTone}`}>
                  {payoutStatusLabel}
                </p>
              </div>
              <StripeConnectButton disabled={!!host.stripe_onboarding_complete} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

