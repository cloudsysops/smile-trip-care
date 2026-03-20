import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";

type BetaFeedbackRow = {
  id: string;
  created_at: string;
  page: string;
  category: string | null;
  sentiment: string | null;
  message: string;
  email: string | null;
};

export default async function AdminFeedbackPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/feedback");
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("beta_feedback")
    .select("id, created_at, page, category, sentiment, message, email")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: BetaFeedbackRow[] = (data ?? []) as BetaFeedbackRow[];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto max-w-4xl px-6 py-8">
        <DashboardLayout
          title="Beta feedback"
          description="Feedback from private beta testers to improve the platform."
        >
          <DashboardSection>
            {error && (
              <p className="mb-4 text-sm text-red-600">
                Could not load feedback. Check Supabase connection.
              </p>
            )}
            {rows.length === 0 ? (
              <p className="text-sm text-zinc-400">No feedback submitted yet.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-900/40">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        When
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Page
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Category
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Sentiment
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Message
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-800 align-top">
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-300">{row.page}</td>
                        <td className="px-4 py-3 text-xs text-zinc-300">
                          {row.category ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-300">
                          {row.sentiment ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-100">
                          <div className="max-w-xs whitespace-pre-wrap break-words">
                            {row.message}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          {row.email ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardSection>
        </DashboardLayout>
      </main>
    </div>
  );
}

