"use client";

import { useMemo, useState } from "react";
import AdminDataTable, { type AdminDataTableColumn } from "@/app/admin/_components/AdminDataTable";
import { generateSuggestedReply } from "@/lib/growth/aiResponder";
import HarvesterActions from "./HarvesterActions";

type HarvesterStatus =
  | "discovered"
  | "replied"
  | "assessment_sent"
  | "converted_to_lead"
  | "ignored";

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

type Props = Readonly<{
  leads: ExternalLead[];
  initialRepliedIds: Record<string, boolean>;
}>;

const SOURCE_ALL = "all";
const STATUS_ALL = "all";
const SCORE_ALL = "all";

function ScoreBadge({ row }: { row: ExternalLead }) {
  const score = row.score ?? "low";
  const reason = row.score_reason ?? "";
  const style =
    score === "high"
      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-semibold"
      : score === "medium"
        ? "border border-amber-500/30 bg-amber-500/10 text-amber-300"
        : "border border-zinc-700 bg-zinc-700/20 text-zinc-300";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${style}`} title={reason}>
      {score}
    </span>
  );
}

export default function HarvesterTableWithFilters({ leads, initialRepliedIds }: Props) {
  const [sourceFilter, setSourceFilter] = useState(SOURCE_ALL);
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL);
  const [scoreFilter, setScoreFilter] = useState(SCORE_ALL);
  const [repliedIds, setRepliedIds] = useState<Record<string, boolean>>(initialRepliedIds);
  const [aiUsedCount, setAiUsedCount] = useState(0);

  const sources = useMemo(() => {
    const set = new Set(leads.map((l) => l.source));
    return [SOURCE_ALL, ...Array.from(set).sort()];
  }, [leads]);

  const statuses = useMemo(() => {
    const set = new Set(leads.map((l) => l.status));
    return [STATUS_ALL, ...Array.from(set).sort()];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((row) => {
      if (sourceFilter !== SOURCE_ALL && row.source !== sourceFilter) return false;
      if (statusFilter !== STATUS_ALL && row.status !== statusFilter) return false;
      const s = row.score ?? "low";
      if (scoreFilter !== SCORE_ALL && s !== scoreFilter) return false;
      return true;
    });
  }, [leads, sourceFilter, statusFilter, scoreFilter]);

  const handleMarkReplied = (id: string, replied: boolean) => {
    setRepliedIds((prev) => ({ ...prev, [id]: replied }));
  };

  const columns: AdminDataTableColumn<ExternalLead>[] = useMemo(
    () => [
      {
        header: "Source",
        cell: (row) => row.source,
      },
      {
        header: "Content",
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm text-zinc-200 line-clamp-3">{row.content}</p>
            <p className="text-xs text-zinc-400">
              Suggested reply:
              <br />
              <span className="block whitespace-pre-wrap rounded border border-zinc-700 bg-zinc-900/40 px-2 py-1">
                {generateSuggestedReply(row.content, row.keyword)}
              </span>
            </p>
          </div>
        ),
      },
      {
        header: "Keyword",
        cell: (row) => row.keyword,
      },
      {
        header: "Status",
        cell: (row) => (
          <span>
            {row.status.replaceAll("_", " ")}
            {repliedIds[row.id] && (
              <span className="ml-1 text-emerald-300" title="Marked replied in this session or saved locally">
                · Replied (local)
              </span>
            )}
          </span>
        ),
      },
      {
        header: "Score",
        cell: (row) => <ScoreBadge row={row} />,
      },
      {
        header: "Created",
        cell: (row) => new Date(row.created_at).toLocaleDateString(),
      },
      {
        header: "Actions",
        cell: (row) => (
          <HarvesterActions
            leadId={row.id}
            postText={row.content}
            keyword={row.keyword}
            deterministicReply={generateSuggestedReply(row.content, row.keyword)}
            url={row.url || null}
            replied={!!repliedIds[row.id]}
            onMarkReplied={handleMarkReplied}
            onAiUsed={() => setAiUsedCount((n) => n + 1)}
          />
        ),
      },
    ],
    [repliedIds]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 pb-3">
        <span className="text-sm font-medium text-zinc-200">Filters:</span>
        <label className="flex items-center gap-1.5 text-sm">
          Source
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-200"
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s === SOURCE_ALL ? "All sources" : s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-200"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === STATUS_ALL ? "All statuses" : s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          Score
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-200"
          >
            <option value={SCORE_ALL}>All scores</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <span className="ml-auto text-xs text-zinc-400">
          Showing {filteredLeads.length} of {leads.length}
        </span>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
        <p className="font-medium text-zinc-200">Score legend</p>
        <p className="mt-0.5">
          <strong>High:</strong> treatment + cost + abroad ·{" "}
          <strong>Medium:</strong> treatment + (cost or abroad) · <strong>Low:</strong> weaker
          signals
        </p>
      </div>

      {aiUsedCount > 0 && (
        <p className="text-xs text-zinc-400" aria-live="polite">
          AI replies this session: <strong>{aiUsedCount}</strong>
        </p>
      )}

      <AdminDataTable
        columns={columns}
        rows={filteredLeads}
        emptyMessage="No leads match the current filters."
      />
    </div>
  );
}
