"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DataTable, { type DataTableColumn } from "@/app/components/dashboard/DataTable";
import DashboardLayout, { DashboardSection } from "@/app/components/dashboard/DashboardLayout";

type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  recommended_package_slug?: string | null;
  package_slug?: string | null;
  selected_specialties?: string[] | null;
  budget_range?: string | null;
};

type Props = Readonly<{
  initialLeads: Lead[];
  nowIso: string;
}>;

type LeadWithPriority = Lead & {
  priority: "overdue" | "due_soon" | "unplanned" | "normal";
  priorityScore: number;
};

const ACTIVE_STATUSES = new Set(["new", "contacted", "qualified"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function resolvePriority(lead: Lead, now: number): LeadWithPriority["priority"] {
  const isActive = ACTIVE_STATUSES.has(lead.status);
  if (!isActive) return "normal";

  if (lead.next_follow_up_at) {
    const dueAt = new Date(lead.next_follow_up_at).getTime();
    if (!Number.isNaN(dueAt)) {
      if (dueAt < now) return "overdue";
      if (dueAt - now <= DAY_MS) return "due_soon";
      return "normal";
    }
  }
  return "unplanned";
}

function priorityScore(priority: LeadWithPriority["priority"]): number {
  switch (priority) {
    case "overdue":
      return 3;
    case "due_soon":
      return 2;
    case "unplanned":
      return 1;
    case "normal":
    default:
      return 0;
  }
}

function badgeClass(priority: LeadWithPriority["priority"]): string {
  switch (priority) {
    case "overdue":
      return "bg-red-100 text-red-700";
    case "due_soon":
      return "bg-amber-100 text-amber-800";
    case "unplanned":
      return "bg-zinc-200 text-zinc-700";
    case "normal":
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function badgeLabel(priority: LeadWithPriority["priority"]): string {
  switch (priority) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "unplanned":
      return "Unplanned";
    case "normal":
    default:
      return "On track";
  }
}

/** AI-style lead score (high/medium/low) from treatment interest and budget. */
function leadScore(lead: Lead): "high" | "medium" | "low" {
  const hasTreatment =
    (Array.isArray(lead.selected_specialties) && lead.selected_specialties.length > 0) ||
    (lead.recommended_package_slug ?? "").trim() !== "" ||
    (lead.package_slug ?? "").trim() !== "";
  const hasBudget = (lead.budget_range ?? "").trim() !== "";
  if (hasTreatment && hasBudget) return "high";
  if (hasTreatment || hasBudget) return "medium";
  return "low";
}

function scoreBadgeClass(score: "high" | "medium" | "low"): string {
  if (score === "high") return "bg-emerald-100 text-emerald-700";
  if (score === "medium") return "bg-amber-100 text-amber-800";
  return "bg-zinc-100 text-zinc-700";
}

/** Operator-friendly next action: recommend package vs collect deposit */
function nextActionLabel(lead: Lead): string {
  if (lead.status === "deposit_paid") return "—";
  const hasRecommendation = (lead.recommended_package_slug ?? "").trim() !== "";
  if (hasRecommendation) return "Ready to collect deposit";
  return "Ready to recommend package";
}

export default function AdminLeadsList({ initialLeads, nowIso }: Props) {
  const [showActionQueueOnly, setShowActionQueueOnly] = useState(false);
  const now = Number.isNaN(Date.parse(nowIso)) ? 0 : Date.parse(nowIso);

  const prioritizedLeads = useMemo<LeadWithPriority[]>(() => {
    const withPriority = initialLeads.map((lead) => {
      const priority = resolvePriority(lead, now);
      return {
        ...lead,
        priority,
        priorityScore: priorityScore(priority),
      };
    });

    withPriority.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return withPriority;
  }, [initialLeads, now]);

  const visibleLeads = useMemo(
    () =>
      showActionQueueOnly
        ? prioritizedLeads.filter((lead) => lead.priority !== "normal")
        : prioritizedLeads,
    [prioritizedLeads, showActionQueueOnly],
  );

  const columns: DataTableColumn<LeadWithPriority>[] = [
    {
      header: "Name",
      cell: (lead) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900">
            {lead.first_name} {lead.last_name}
          </span>
          <span className="text-xs text-zinc-500">
            {new Date(lead.created_at).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: "Email",
      cell: (lead) => lead.email,
    },
    {
      header: "Treatment interest",
      cell: (lead) =>
        lead.selected_specialties?.[0] ??
        lead.recommended_package_slug ??
        lead.package_slug ??
        "—",
    },
    {
      header: "Score",
      cell: (lead) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreBadgeClass(
            leadScore(lead),
          )}`}
        >
          {leadScore(lead).toUpperCase()}
        </span>
      ),
    },
    {
      header: "Priority",
      cell: (lead) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
            lead.priority,
          )}`}
        >
          {badgeLabel(lead.priority)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (lead) => lead.status,
    },
    {
      header: "Next action",
      cell: (lead) => (
        <span className="text-xs font-medium text-zinc-700">
          {nextActionLabel(lead)}
        </span>
      ),
    },
    {
      header: "Next follow-up",
      cell: (lead) =>
        lead.next_follow_up_at
          ? new Date(lead.next_follow_up_at).toLocaleString()
          : "—",
    },
    {
      header: "Last contacted",
      cell: (lead) =>
        lead.last_contacted_at
          ? new Date(lead.last_contacted_at).toLocaleString()
          : "—",
    },
    {
      header: "",
      cell: (lead) => (
        <Link
          href={`/admin/leads/${lead.id}`}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Leads"
      description="Actionable view of assessment leads with priority and next steps."
      actions={
        <button
          type="button"
          onClick={() => setShowActionQueueOnly((current) => !current)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {showActionQueueOnly ? "Show all" : "Show action queue"}
        </button>
      }
    >
      <DashboardSection>
        <p className="mb-3 text-sm text-zinc-600">
          {visibleLeads.length} lead{visibleLeads.length === 1 ? "" : "s"}
          {showActionQueueOnly ? " in action queue" : " total"}
        </p>
        <DataTable
          columns={columns}
          rows={visibleLeads}
          emptyMessage="No leads yet. New assessments will appear here."
        />
      </DashboardSection>
    </DashboardLayout>
  );
}
