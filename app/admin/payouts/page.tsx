import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";

type HostRow = {
  id: string;
  display_name: string;
  city: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  stripe_details_submitted: boolean | null;
};

type SpecialistRow = {
  id: string;
  name: string;
  city: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  stripe_details_submitted: boolean | null;
};

async function getStripeReadiness() {
  const supabase = getServerSupabase();
  const { data: hosts } = await supabase
    .from("hosts")
    .select("id, display_name, city, stripe_account_id, stripe_onboarding_complete, stripe_details_submitted")
    .order("display_name", { ascending: true });

  const { data: specialists } = await supabase
    .from("specialists")
    .select("id, name, city, stripe_account_id, stripe_onboarding_complete, stripe_details_submitted")
    .order("name", { ascending: true });

  return {
    hosts: (hosts ?? []) as HostRow[],
    specialists: (specialists ?? []) as SpecialistRow[],
  };
}

function readinessLabel(
  row: { stripe_onboarding_complete: boolean | null; stripe_details_submitted: boolean | null; stripe_account_id: string | null },
) {
  if (row.stripe_onboarding_complete) return "Ready";
  if (row.stripe_details_submitted) return "Pending verification";
  if (row.stripe_account_id) return "Account created";
  return "Not connected";
}

export default async function AdminPayoutsReadinessPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login?next=/admin/payouts");
  }

  const { hosts, specialists } = await getStripeReadiness();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100">Payout readiness</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Stripe Connect status for hosts and specialists. Manual payouts remain the source of truth; this page only
            indicates readiness for future automated payouts.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Hosts</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
            {hosts.length === 0 ? (
              <p className="px-4 py-3 text-sm text-zinc-400">No hosts configured yet.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/40 text-xs font-medium text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Stripe account</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map((h) => (
                    <tr key={h.id} className="border-b border-zinc-800">
                      <td className="px-4 py-3 text-zinc-100">{h.display_name}</td>
                      <td className="px-4 py-3 text-zinc-400">{h.city ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">
                        {h.stripe_account_id ? h.stripe_account_id : "Not created"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-zinc-700/20 px-3 py-1 text-xs font-medium text-zinc-300">
                          {readinessLabel(h)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Specialists</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
            {specialists.length === 0 ? (
              <p className="px-4 py-3 text-sm text-zinc-400">No specialists configured yet.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/40 text-xs font-medium text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Stripe account</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {specialists.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-800">
                      <td className="px-4 py-3 text-zinc-100">{s.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{s.city ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-zinc-300">
                        {s.stripe_account_id ? s.stripe_account_id : "Not created"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-zinc-700/20 px-3 py-1 text-xs font-medium text-zinc-300">
                          {readinessLabel(s)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

