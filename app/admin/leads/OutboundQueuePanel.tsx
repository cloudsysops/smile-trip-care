"use client";

import { useMemo, useState } from "react";

type OutboundStatus =
  | "draft"
  | "approved"
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "replied"
  | "cancelled";
type OutboundChannel = "whatsapp" | "email";

type OutboundMessageRow = {
  id: string;
  lead_id: string;
  source: "ai_draft" | "manual";
  channel: OutboundChannel;
  status: OutboundStatus;
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
};

type AiDraftInput = {
  whatsapp_message: string;
  email_subject: string;
  email_body: string;
} | null;

type Props = {
  leadId: string;
  initialRows: OutboundMessageRow[];
  latestAiDraft: AiDraftInput;
};

function statusBadgeClass(status: OutboundStatus): string {
  switch (status) {
    case "draft":
      return "bg-zinc-100 text-zinc-700";
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "queued":
      return "bg-indigo-100 text-indigo-700";
    case "sent":
      return "bg-emerald-100 text-emerald-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    case "replied":
      return "bg-teal-100 text-teal-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-zinc-200 text-zinc-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export default function OutboundQueuePanel({ leadId, initialRows, latestAiDraft }: Props) {
  const [rows, setRows] = useState<OutboundMessageRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<OutboundChannel>("whatsapp");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");

  const stats = useMemo(() => {
    const sentLike = rows.filter((row) => row.status === "sent" || row.status === "delivered" || row.status === "replied").length;
    const failed = rows.filter((row) => row.status === "failed").length;
    const drafts = rows.filter((row) => row.status === "draft" || row.status === "approved").length;
    return { total: rows.length, sentLike, failed, drafts };
  }, [rows]);

  async function safeJson(res: Response) {
    return res.json().catch(() => ({}));
  }

  async function createMessage(payload: {
    source: "ai_draft" | "manual";
    channel: OutboundChannel;
    subject?: string;
    body_text: string;
    status?: "draft" | "approved";
  }) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/outbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    setLoading(false);
    if (!res.ok) {
      setError((data.error as string) ?? "Failed to create outbound message");
      return;
    }
    const row = data.message as OutboundMessageRow;
    setRows((current) => [row, ...current]);
  }

  async function transitionStatus(id: string, status: OutboundStatus) {
    setLoading(true);
    setError(null);
    const failureReason = status === "failed" ? window.prompt("Failure reason", "Delivery failed") ?? "" : "";
    const payload = status === "failed"
      ? { status, failure_reason: failureReason }
      : { status };
    const res = await fetch(`/api/admin/outbound-messages/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);
    setLoading(false);
    if (!res.ok) {
      setError((data.error as string) ?? "Failed to update outbound status");
      return;
    }
    const updated = data.message as OutboundMessageRow;
    setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Outbound conversion queue</h2>
        <p className="text-xs text-zinc-500">
          Total: {stats.total} · Drafts: {stats.drafts} · Sent: {stats.sentLike} · Failed: {stats.failed}
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {latestAiDraft && (
        <div className="rounded border border-zinc-200 p-4">
          <p className="text-sm font-medium">Create from latest AI draft</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                createMessage({
                  source: "ai_draft",
                  channel: "whatsapp",
                  body_text: latestAiDraft.whatsapp_message,
                })
              }
              className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Queue WhatsApp draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                createMessage({
                  source: "ai_draft",
                  channel: "email",
                  subject: latestAiDraft.email_subject,
                  body_text: latestAiDraft.email_body,
                })
              }
              className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
            >
              Queue Email draft
            </button>
          </div>
        </div>
      )}

      <div className="rounded border border-zinc-200 p-4">
        <p className="text-sm font-medium">Create manual outbound draft</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-zinc-600">
            Channel
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value as OutboundChannel)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </label>
          <label className="text-xs text-zinc-600">
            Subject (email only)
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
            />
          </label>
        </div>
        <label className="mt-2 block text-xs text-zinc-600">
          Message
          <textarea
            value={bodyText}
            onChange={(event) => setBodyText(event.target.value)}
            rows={4}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || bodyText.trim().length === 0}
            onClick={async () => {
              await createMessage({
                source: "manual",
                channel,
                subject: channel === "email" ? subject : "",
                body_text: bodyText,
              });
              setBodyText("");
            }}
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={loading || bodyText.trim().length === 0}
            onClick={async () => {
              await createMessage({
                source: "manual",
                channel,
                subject: channel === "email" ? subject : "",
                body_text: bodyText,
                status: "approved",
              });
              setBodyText("");
            }}
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            Save + approve
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No outbound messages queued yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded border border-zinc-200 p-3 text-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {row.channel === "email" ? "Email" : "WhatsApp"} · {row.source === "ai_draft" ? "AI draft" : "Manual"}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                  {row.status}
                </span>
              </div>
              {row.subject && <p className="mb-1 text-xs text-zinc-600">Subject: {row.subject}</p>}
              <p className="whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs">{row.body_text}</p>
              {row.failure_reason && <p className="mt-2 text-xs text-red-600">Failure: {row.failure_reason}</p>}
              <p className="mt-2 text-xs text-zinc-500">
                Attempts {row.attempts}/{row.max_attempts} · Created {new Date(row.created_at).toLocaleString()}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {row.status === "draft" && (
                  <>
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "approved")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Approve</button>
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "cancelled")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Cancel</button>
                  </>
                )}
                {row.status === "approved" && (
                  <>
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "queued")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Queue send</button>
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "sent")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Mark sent</button>
                  </>
                )}
                {row.status === "queued" && (
                  <>
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "sent")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Mark sent</button>
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "failed")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Mark failed</button>
                  </>
                )}
                {(row.status === "sent" || row.status === "delivered") && (
                  <>
                    {row.status === "sent" && (
                      <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "delivered")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Mark delivered</button>
                    )}
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "replied")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Mark replied</button>
                    <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "failed")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Mark failed</button>
                  </>
                )}
                {row.status === "failed" && (
                  <button type="button" disabled={loading} onClick={() => transitionStatus(row.id, "queued")} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">Retry</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
