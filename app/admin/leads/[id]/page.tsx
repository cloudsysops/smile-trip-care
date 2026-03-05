import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import LeadStatusForm from "../LeadStatusForm";
import DepositButton from "../DepositButton";

type Props = { params: Promise<{ id: string }> };

export default async function AdminLeadDetailPage({ params }: Props) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/leads");
  }
  const { id } = await params;
  const supabase = getServerSupabase();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !lead) notFound();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/admin/leads" className="text-sm text-zinc-600 hover:underline">← Leads</Link>
          <h1 className="text-xl font-semibold">Lead: {lead.first_name} {lead.last_name}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <dl className="grid gap-3 text-sm">
            <div><dt className="font-medium text-zinc-500">Email</dt><dd>{lead.email}</dd></div>
            {lead.phone && <div><dt className="font-medium text-zinc-500">Phone</dt><dd>{lead.phone}</dd></div>}
            {lead.country && <div><dt className="font-medium text-zinc-500">Country</dt><dd>{lead.country}</dd></div>}
            {lead.package_slug && <div><dt className="font-medium text-zinc-500">Package</dt><dd>{lead.package_slug}</dd></div>}
            <div><dt className="font-medium text-zinc-500">Status</dt><dd>{lead.status}</dd></div>
            <div><dt className="font-medium text-zinc-500">Created</dt><dd>{new Date(lead.created_at).toLocaleString()}</dd></div>
            {lead.message && <div><dt className="font-medium text-zinc-500">Message</dt><dd className="whitespace-pre-wrap">{lead.message}</dd></div>}
          </dl>
        </div>
        <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="font-semibold">Stripe deposit</h2>
          <p className="mt-1 text-sm text-zinc-600">Create a checkout session for the deposit.</p>
          <DepositButton leadId={lead.id} />
        </div>
      </main>
    </div>
  );
}
