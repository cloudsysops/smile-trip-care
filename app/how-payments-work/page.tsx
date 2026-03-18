import Link from "next/link";
import { branding } from "@/lib/branding";

export const metadata = {
  title: `How payments work | ${branding.productName}`,
  description: `${branding.productName} explains secure deposits via Stripe and how coordination and payouts work today.`,
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

export default function HowPaymentsWorkPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-sm font-medium text-zinc-400 hover:text-white">
            ← Back to home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            How payments work
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        <section className="mb-10">
          <h1 className="font-serif text-3xl font-normal tracking-tight text-white md:text-4xl">
            How deposits and payments work
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-zinc-300 md:text-base">
            {branding.productName} explains how deposits work, what Stripe is used for, and how we handle payouts to
            clinics, hosts, and specialists today. The goal is transparency—so you know what happens when you pay a
            deposit.
          </p>
        </section>

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <Stat label="Payment processor" value="Stripe (secure deposits)" />
          <Stat label="Today" value="Deposits via Stripe, payouts handled manually" />
          <Stat label="Direction" value="Stripe Connect for future automated payouts" />
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            The deposit
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-sm text-zinc-300">
              When you move forward with a package, you&apos;ll usually see a **deposit amount**. This deposit:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-300">
              <li>• Secures your spot and allows us to coordinate your dates with the clinic.</li>
              <li>• Is paid online using Stripe, a global payment processor.</li>
              <li>• Is shown clearly before you confirm payment—no hidden fees.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              The remaining balance (if any) is usually settled directly with the clinic or as described in your package
              terms. Your coordinator will walk you through this before you commit.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            What Stripe does (and doesn&apos;t) do
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h3 className="mb-2 text-sm font-semibold text-white">What Stripe is used for</h3>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>• Securely processes your card payment for the deposit.</li>
                <li>• Sends us a confirmation when the payment succeeds.</li>
                <li>• Helps us reconcile payment status in your patient dashboard.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <h3 className="mb-2 text-sm font-semibold text-white">What still happens internally</h3>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>• We track how much is owed to clinics, hosts, and specialists.</li>
                <li>• Our team currently manages payouts manually based on internal records.</li>
                <li>• We are rolling out Stripe Connect so this can become more automated over time.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Where your money goes today
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <ol className="space-y-3 text-sm text-zinc-300">
              <li>
                <strong className="text-zinc-100">1. You pay a deposit via Stripe.</strong>
                <br />
                The deposit is processed securely. You&apos;ll see Stripe (or our platform name) on your card statement.
              </li>
              <li>
                <strong className="text-zinc-100">2. We mark your lead/booking as deposit paid.</strong>
                <br />
                Internally we store the payment and update your booking status so coordinators and clinics know you&apos;re
                confirmed.
              </li>
              <li>
                <strong className="text-zinc-100">3. We allocate earnings internally.</strong>
                <br />
                Based on your package and agreements, we split revenue between the platform, clinics, and any relevant
                hosts or specialists.
              </li>
              <li>
                <strong className="text-zinc-100">4. Payouts to partners are currently manual.</strong>
                <br />
                Our team uses internal payout records and banking/settlement processes. This is the part that Stripe
                Connect will gradually modernize.
              </li>
            </ol>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Future: Stripe Connect and automated payouts
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-sm text-zinc-300">
              We are rolling out **Stripe Connect** for hosts and specialists. This means:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-300">
              <li>• Partners can connect their own Stripe accounts to receive payouts more directly.</li>
              <li>• Over time, we can reduce manual payout steps and reconcile faster.</li>
              <li>• Our goal is to keep the flow transparent—who gets what, and when.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Even as we modernize payouts, your primary relationship for clinical care remains with the clinic and
              specialists providing treatment. Our role is to coordinate and provide clear, auditable financial flows.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Refunds and disputes (high‑level)
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="text-sm text-zinc-300">
              Exact refund and dispute policies may depend on the clinic and package you choose. Before you pay a
              deposit, your coordinator will:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-300">
              <li>• Explain the deposit conditions for your specific package.</li>
              <li>• Clarify what happens if dates need to move or your case is not clinically viable.</li>
              <li>• Share how to contact us and the clinic if you have concerns after payment.</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              This page is informational only and does not override the specific terms you receive for your package.
              Always review and keep a copy of your agreed‑upon conditions.
            </p>
          </div>
        </section>

        <section className="mb-4 border-t border-zinc-800 pt-6 text-sm text-zinc-400">
          <p>
            Related:{" "}
            <Link href="/trust-and-safety" className="text-emerald-400 hover:text-emerald-300">
              Trust &amp; safety →
            </Link>{" "}
            ·{" "}
            <Link href="/our-clinical-network" className="text-emerald-400 hover:text-emerald-300">
              Our clinical network →
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}

