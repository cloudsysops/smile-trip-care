import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import LeadStatusForm from "../LeadStatusForm";
import DepositButton from "../DepositButton";
import AiActionsPanel from "./AiActionsPanel";
import { ItineraryOutputSchema, LeadTriageOutputSchema, SalesResponderOutputSchema } from "@/lib/ai/schemas";

type Props = { params: Promise<{ id: string }> };
const StoredMessageSchema = SalesResponderOutputSchema.extend({
  cta_url: z.string().url().optional(),
  generated_at: z.string().optional(),
});

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

  const { data: aiRows } = await supabase
    .from("lead_ai")
    .select("triage_json, messages_json")
    .eq("lead_id", id)
    .order("created_at", { ascending: false })
    .limit(1);
  const latestAi = aiRows?.[0];
  const triageMaybe = LeadTriageOutputSchema.safeParse(latestAi?.triage_json);
  const messagesMaybe = StoredMessageSchema.safeParse(latestAi?.messages_json);

  const { data: itineraryRows } = await supabase
    .from("itineraries")
    .select("id, city, content_json, created_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const parsedItineraries = (itineraryRows ?? []).map((row) => {
    const parsed = ItineraryOutputSchema.safeParse(row.content_json);
    return {
      id: row.id as string,
      city: (row.city as string | null) ?? null,
      content_json: parsed.success ? parsed.data : null,
      created_at: row.created_at as string,
    };
  });

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
        <AiActionsPanel
          leadId={lead.id}
          initialTriage={triageMaybe.success ? triageMaybe.data : null}
          initialMessage={messagesMaybe.success ? messagesMaybe.data : null}
          initialItineraries={parsedItineraries}
        />
      </main>
    </div>
  );
}
