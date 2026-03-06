import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import LeadStatusForm from "../LeadStatusForm";
import DepositButton from "../DepositButton";
import AiActionsPanel from "./AiActionsPanel";
import { ItineraryOutputSchema, LeadTriageOutputSchema, SalesResponderOutputSchema } from "@/lib/ai/schemas";
import AdminShell from "../../_components/AdminShell";

type Props = { params: Promise<{ id: string }> };
const StoredMessageSchema = SalesResponderOutputSchema.extend({
  cta_url: z.string().url().optional(),
  generated_at: z.string().optional(),
  lead_snapshot_minimal: z
    .object({
      lead_id: z.string().uuid(),
      name: z.string().min(1),
      email: z.string().email(),
      country: z.string().nullable(),
      package_slug: z.string().nullable(),
    })
    .optional(),
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
  const attributionFields = [
    { label: "UTM source", value: lead.utm_source as string | null | undefined },
    { label: "UTM medium", value: lead.utm_medium as string | null | undefined },
    { label: "UTM campaign", value: lead.utm_campaign as string | null | undefined },
    { label: "UTM term", value: lead.utm_term as string | null | undefined },
    { label: "UTM content", value: lead.utm_content as string | null | undefined },
    { label: "Landing path", value: lead.landing_path as string | null | undefined },
    { label: "Referrer URL", value: lead.referrer_url as string | null | undefined },
  ];

  return (
    <AdminShell
      title={`Lead: ${lead.first_name} ${lead.last_name}`}
      currentSection="leads"
      headerLeading={
        <Link href="/admin/leads" className="text-sm text-zinc-600 hover:underline">
          ← Leads
        </Link>
      }
      headerContainerClassName="max-w-4xl"
      mainContainerClassName="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <dl className="grid gap-3 text-sm">
            <div><dt className="font-medium text-zinc-500">Email</dt><dd>{lead.email}</dd></div>
            {lead.phone && <div><dt className="font-medium text-zinc-500">Phone</dt><dd>{lead.phone}</dd></div>}
            {lead.country && <div><dt className="font-medium text-zinc-500">Country</dt><dd>{lead.country}</dd></div>}
            {lead.package_slug && <div><dt className="font-medium text-zinc-500">Package</dt><dd>{lead.package_slug}</dd></div>}
            <div><dt className="font-medium text-zinc-500">Status</dt><dd>{lead.status}</dd></div>
            <div><dt className="font-medium text-zinc-500">Created</dt><dd>{new Date(lead.created_at).toLocaleString()}</dd></div>
            {lead.message && <div><dt className="font-medium text-zinc-500">Message</dt><dd className="whitespace-pre-wrap">{lead.message}</dd></div>}
            {attributionFields.some((item) => item.value) && (
              <div className="space-y-1 pt-2">
                <dt className="font-medium text-zinc-500">Attribution</dt>
                <dd>
                  <ul className="space-y-1">
                    {attributionFields.map((item) =>
                      item.value ? (
                        <li key={item.label}>
                          <span className="font-medium text-zinc-500">{item.label}:</span>{" "}
                          <span className="break-all">{item.value}</span>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </dd>
              </div>
            )}
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
      </div>
    </AdminShell>
  );
}
