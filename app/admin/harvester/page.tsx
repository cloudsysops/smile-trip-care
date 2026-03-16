import { redirect } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import AdminShell from "@/app/admin/_components/AdminShell";
import { requireAdmin } from "@/lib/auth";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";
import StatCard from "@/app/components/dashboard/StatCard";
import EmptyState from "@/app/components/ui/EmptyState";
import { readHarvesterRepliedState } from "@/lib/growth/harvesterState";
import HarvesterTableWithFilters from "./HarvesterTableWithFilters";

type HarvesterStatus = "discovered" | "replied" | "assessment_sent" | "converted_to_lead" | "ignored";

type ExternalLead = {
  id: string;
  source: string;
  content: string;
  keyword: string;
  status: HarvesterStatus;
  url: string;
  created_at: string;
  score?: "high" | "medium" | "low";
  score_reason?: string;
};

const MOCK_EXTERNAL_LEADS: ExternalLead[] = [
  {
    id: "ext-1",
    source: "reddit/r/dentistry",
    content: "Got a quote for $18k for full mouth implants in the US. Are there safer, more affordable options abroad?",
    keyword: "dental implants cost",
    status: "discovered",
    url: "https://www.reddit.com/r/dentistry",
    created_at: new Date().toISOString(),
    score: "high",
    score_reason: "implants + cost + abroad",
  },
  {
    id: "ext-2",
    source: "reddit/r/medicaltourism",
    content: "Anyone done veneers in Colombia? Looking for experiences and what to expect.",
    keyword: "veneers colombia",
    status: "replied",
    url: "https://www.reddit.com/r/medicaltourism",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    score: "medium",
    score_reason: "veneers + colombia",
  },
  {
    id: "ext-3",
    source: "twitter",
    content: "US dentist quoted me 16k for smile design. Thinking about Medellín or Mexico. Any recommendations?",
    keyword: "smile design cost",
    status: "assessment_sent",
    url: "https://twitter.com",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    score: "medium",
    score_reason: "cost + travel",
  },
  {
    id: "ext-4",
    source: "reddit/r/dentalimplants",
    content: "Follow-up: I ended up booking a trip to Colombia for implants after getting way better numbers.",
    keyword: "implants colombia",
    status: "converted_to_lead",
    url: "https://www.reddit.com/r/dentalimplants",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    score: "high",
    score_reason: "implants + colombia",
  },
];

async function loadExternalLeadsFromFile(): Promise<ExternalLead[] | null> {
  try {
    const filePath = path.join(process.cwd(), "data", "external_leads.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Basic runtime validation
    const rows: ExternalLead[] = parsed
      .map((item) => ({
        id: String(item.id ?? ""),
        source: String(item.source ?? "reddit"),
        content: String(item.content ?? ""),
        keyword: String(item.keyword ?? "[unclassified]"),
        status: (item.status as HarvesterStatus) ?? "discovered",
        url: String(item.url ?? ""),
        created_at: String(item.created_at ?? new Date().toISOString()),
        score: item.score === "high" || item.score === "medium" || item.score === "low" ? item.score : undefined,
        score_reason: typeof item.score_reason === "string" ? item.score_reason : undefined,
      }))
      .filter((row) => row.content.trim().length > 0);
    return rows;
  } catch {
    return null;
  }
}

export default async function AdminHarvesterPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/harvester");
  }

  const fileLeads = await loadExternalLeadsFromFile();
  const leads = fileLeads && fileLeads.length > 0 ? fileLeads : MOCK_EXTERNAL_LEADS;
  const repliedState = await readHarvesterRepliedState();

  const discoveredCount = leads.filter((l) => l.status === "discovered").length;
  const repliedCount = leads.filter((l) => l.status === "replied").length;
  const assessmentSentCount = leads.filter((l) => l.status === "assessment_sent").length;
  const convertedCount = leads.filter((l) => l.status === "converted_to_lead").length;
  const highScoreCount = leads.filter((l) => l.score === "high").length;

  return (
    <AdminShell
      title="Admin — Harvester"
      currentSection="leads"
      headerContainerClassName="max-w-4xl"
      mainContainerClassName="max-w-4xl"
    >
      <DashboardLayout
        title="Lead harvester"
        description="Review external conversations about dental treatment and prepare replies that invite people to take the Smile assessment."
      >
        <DashboardSection>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Discovered" value={discoveredCount} helper="New posts to review" />
            <StatCard label="Replied" value={repliedCount} helper="Replies drafted or sent" />
            <StatCard
              label="Assessment sent"
              value={assessmentSentCount}
              helper="Invites with assessment link"
            />
            <StatCard
              label="Converted"
              value={convertedCount}
              helper="External leads linked to Smile leads"
            />
            <StatCard
              label="High-score leads"
              value={highScoreCount}
              helper="Strong intent (treatment + cost + abroad)"
            />
          </div>
        </DashboardSection>
        <DashboardSection
          title="External leads"
          description="Preview real-world posts and prepare helpful, patient-friendly replies."
        >
          {leads.length === 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <EmptyState
                title="No external leads yet"
                description="When scrapers or manual discovery add posts from Reddit, Twitter, or other sources, they will appear here for review."
              />
            </div>
          ) : (
            <HarvesterTableWithFilters leads={leads} initialRepliedIds={repliedState} />
          )}
        </DashboardSection>
      </DashboardLayout>
    </AdminShell>
  );
}

