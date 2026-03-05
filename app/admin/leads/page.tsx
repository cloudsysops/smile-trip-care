import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import AdminLeadsList from "./AdminLeadsList";

export default async function AdminLeadsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/leads");
  }
  const supabase = getServerSupabase();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, status, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    return <p className="p-8 text-red-600">Error loading leads.</p>;
  }
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-xl font-semibold">Admin — Leads</h1>
          <form action="/api/auth/signout" method="post" className="inline">
            <button type="submit" className="text-sm text-zinc-600 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <AdminLeadsList initialLeads={leads ?? []} />
      </main>
    </div>
  );
}
