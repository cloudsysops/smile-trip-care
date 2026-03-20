import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import AdminLeadsList from "./AdminLeadsList";
import AdminShell from "../_components/AdminShell";

export default async function AdminLeadsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/leads");
  }
  const supabase = getServerSupabase();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, status, created_at, last_contacted_at, next_follow_up_at, recommended_package_slug, package_slug, selected_specialties, budget_range")
    .order("created_at", { ascending: false });
  if (error) {
    return <p className="p-8 text-red-600">Error loading leads.</p>;
  }
  return (
    <AdminShell
      title="Admin — Leads"
      currentSection="leads"
      headerContainerClassName="max-w-4xl"
      mainContainerClassName="max-w-4xl"
    >
      <AdminLeadsList initialLeads={leads ?? []} nowIso={new Date().toISOString()} />
    </AdminShell>
  );
}
