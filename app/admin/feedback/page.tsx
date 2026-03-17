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
    <div className="min-h-screen bg-zinc-50">
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
              <p className="text-sm text-zinc-600">No feedback submitted yet.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        When
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Page
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Category
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Sentiment
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Message
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-100 align-top">
                        <td className="px-4 py-3 text-xs text-zinc-600">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-700">{row.page}</td>
                        <td className="px-4 py-3 text-xs text-zinc-700">
                          {row.category ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-700">
                          {row.sentiment ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-900">
                          <div className="max-w-xs whitespace-pre-wrap break-words">
                            {row.message}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600">
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

