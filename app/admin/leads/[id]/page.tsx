import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPublishedPackages } from "@/lib/packages";
import LeadStatusForm from "../LeadStatusForm";
import LeadFollowUpForm from "../LeadFollowUpForm";
import LeadRecommendationForm from "../LeadRecommendationForm";
import DepositButton from "../DepositButton";
import AiActionsPanel from "./AiActionsPanel";
import LeadCopilotPanel from "./LeadCopilotPanel";
import LeadFollowUpSection from "./LeadFollowUpSection";
import OutboundQueuePanel from "../OutboundQueuePanel";
import { ItineraryOutputSchema, LeadTriageOutputSchema, SalesResponderOutputSchema } from "@/lib/ai/schemas";
import { getLatestProgressForLead } from "@/lib/clinical/progress";
import AdminShell from "../../_components/AdminShell";

type Props = Readonly<{ params: Promise<{ id: string }> }>;
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

  const packageSlugForDeposit = (lead.recommended_package_slug as string | null)?.trim() || (lead.package_slug as string | null)?.trim() || null;
  let depositAmountCents: number | null = null;
  if (packageSlugForDeposit) {
    const { data: packageRow } = await supabase
      .from("packages")
      .select("deposit_cents")
      .eq("slug", packageSlugForDeposit)
      .maybeSingle();
    const raw = packageRow?.deposit_cents;
    const value =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw)
          : NaN;
    if (Number.isInteger(value) && value > 0) {
      depositAmountCents = value;
    }
  }

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
  const { data: outboundRows } = await supabase
    .from("outbound_messages")
    .select("id, lead_id, source, channel, status, subject, body_text, attempts, max_attempts, scheduled_for, sent_at, delivered_at, replied_at, failure_reason, created_at, updated_at")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const publishedPackages = await getPublishedPackages();
  const packageOptions = publishedPackages.map((p) => ({ id: p.id, slug: p.slug, name: p.name }));
  const latestProgress = await getLatestProgressForLead(lead.id);

  return (
    <AdminShell
      title={`Lead: ${lead.first_name} ${lead.last_name}`}
      currentSection="leads"
      headerLeading={
        <Link href="/admin/leads" className="text-sm text-zinc-400 hover:underline">
          ← Back to leads
        </Link>
      }
      headerContainerClassName="max-w-4xl"
      mainContainerClassName="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Primary overview: status, recommendation, deposit */}
        <section className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:grid-cols-3">
          {lead.status !== "deposit_paid" && (
            <p className="sm:col-span-3 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-200">
              {!(lead.recommended_package_slug as string)?.trim()
                ? "Ready to recommend package — set a recommendation below, then collect deposit when the lead is ready."
                : "Ready to collect deposit — use the Collect deposit button when the lead is ready to pay."}
            </p>
          )}
          <div className="sm:col-span-1 border-b border-zinc-800 pb-4 sm:border-b-0 sm:border-r sm:pr-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Lead status</h2>
            <p className="mt-2 text-sm font-semibold text-zinc-100">{lead.status}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Created {new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </p>
            {lead.last_contacted_at && (
              <p className="mt-1 text-xs text-zinc-400">
                Last contacted {new Date(lead.last_contacted_at).toLocaleString()}
              </p>
            )}
            {lead.next_follow_up_at && (
              <p className="mt-1 text-xs text-zinc-400">
                Next follow-up {new Date(lead.next_follow_up_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="sm:col-span-1 border-b border-zinc-800 pb-4 sm:border-b-0 sm:border-r sm:px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Package (recommend if not set)</h2>
            <p className="mt-2 text-sm text-zinc-100">
              {lead.recommended_package_slug && lead.recommended_package_slug !== ""
                ? lead.recommended_package_slug
                : lead.package_slug
                  ? `From form: ${lead.package_slug}`
                  : "No package selected yet"}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Use <span className="font-semibold">Recommend package</span> below to choose the journey for this lead.
            </p>
          </div>
          <div className="sm:col-span-1 pt-4 sm:pt-0 sm:pl-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">Deposit (collect when ready)</h2>
            <p className="mt-2 text-sm text-zinc-100">
              {lead.status === "deposit_paid" ? "Paid" : "Collect via Stripe Checkout when lead is ready."}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              When you&apos;re ready to secure the booking, click Collect deposit below.
            </p>
            <div className="mt-3">
              <DepositButton leadId={lead.id} amountCents={depositAmountCents} />
            </div>
          </div>
        </section>

        {/* Lead details */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-sm font-semibold text-zinc-100">Lead details</h2>
          <dl className="mt-3 grid gap-3 text-sm">
            <div>
              <dt className="font-medium text-zinc-300">Email</dt>
              <dd>{lead.email}</dd>
            </div>
            {lead.phone && (
              <div>
                <dt className="font-medium text-zinc-300">Phone</dt>
                <dd>{lead.phone}</dd>
              </div>
            )}
            {lead.country && (
              <div>
                <dt className="font-medium text-zinc-300">Country</dt>
                <dd>{lead.country}</dd>
              </div>
            )}
            {lead.package_slug && (
              <div>
                <dt className="font-medium text-zinc-300">Package from form</dt>
                <dd>{lead.package_slug}</dd>
              </div>
            )}
            {lead.message && (
              <div>
                <dt className="font-medium text-zinc-300">Message</dt>
                <dd className="whitespace-pre-wrap">{lead.message}</dd>
              </div>
            )}
            {lead.follow_up_notes && (
              <div>
                <dt className="font-medium text-zinc-300">Follow-up notes</dt>
                <dd className="whitespace-pre-wrap">{lead.follow_up_notes}</dd>
              </div>
            )}
            {attributionFields.some((item) => item.value) && (
              <div className="space-y-1 pt-2">
                <dt className="font-medium text-zinc-300">Attribution</dt>
                <dd>
                  <ul className="space-y-1">
                    {attributionFields.map((item) =>
                      item.value ? (
                        <li key={item.label}>
                          <span className="font-medium text-zinc-300">{item.label}:</span>{" "}
                          <span className="break-all">{item.value}</span>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </section>

        {latestProgress && (
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="text-sm font-semibold text-zinc-100">Treatment progress</h2>
            <p className="mt-1 text-xs text-zinc-400">Latest update from specialist</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-200">
                {latestProgress.stage_label}
              </span>
              <span className="text-xs text-zinc-400">
                {new Date(latestProgress.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </span>
            </div>
            {latestProgress.notes?.trim() && (
              <p className="mt-2 text-sm text-zinc-200 line-clamp-2">{latestProgress.notes.trim()}</p>
            )}
          </section>
        )}

        <LeadCopilotPanel
          leadId={lead.id}
          leadPhone={(lead.phone as string | null) ?? null}
          leadFirstName={(lead.first_name as string | null) ?? null}
        />
        <LeadFollowUpSection
          leadId={lead.id}
          leadPhone={(lead.phone as string | null) ?? null}
          leadCreatedAt={(lead.created_at as string | null) ?? null}
        />
        <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
        <LeadRecommendationForm
          leadId={lead.id}
          currentRecommendedSlug={(lead.recommended_package_slug as string | null) ?? null}
          packages={packageOptions}
        />
        <LeadFollowUpForm
          leadId={lead.id}
          currentStatus={lead.status}
          currentLastContactedAt={(lead.last_contacted_at as string | null | undefined) ?? null}
          currentNextFollowUpAt={(lead.next_follow_up_at as string | null | undefined) ?? null}
          currentFollowUpNotes={(lead.follow_up_notes as string | null | undefined) ?? null}
        />
        <AiActionsPanel
          leadId={lead.id}
          initialTriage={triageMaybe.success ? triageMaybe.data : null}
          initialMessage={messagesMaybe.success ? messagesMaybe.data : null}
          initialItineraries={parsedItineraries}
        />
        <OutboundQueuePanel
          leadId={lead.id}
          initialRows={(outboundRows ?? []) as Array<{
            id: string;
            lead_id: string;
            source: "ai_draft" | "manual";
            channel: "whatsapp" | "email";
            status: "draft" | "approved" | "queued" | "sent" | "delivered" | "failed" | "replied" | "cancelled";
            subject: string | null;
            body_text: string;
            attempts: number;
            max_attempts: number;
            scheduled_for: string;
            sent_at: string | null;
            delivered_at: string | null;
            replied_at: string | null;
            failure_reason: string | null;
            created_at: string;
            updated_at: string;
          }>}
          latestAiDraft={messagesMaybe.success ? {
            whatsapp_message: messagesMaybe.data.whatsapp_message,
            email_subject: messagesMaybe.data.email_subject,
            email_body: messagesMaybe.data.email_body,
          } : null}
        />
      </div>
    </AdminShell>
  );
}
