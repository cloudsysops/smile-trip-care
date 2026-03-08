"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QueueRow = {
  id: string;
  lead_id: string;
  source: string;
  channel: "whatsapp" | "email";
  status: "approved" | "queued" | "failed" | "sent" | "delivered" | "replied" | "cancelled" | "draft";
  subject: string | null;
  body_text: string;
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  failure_reason: string | null;
  created_at: string;
  leads: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  };
};

type MetricsPayload = {
  metrics: {
    total_outbound_messages: number;
    actionable_queue_count: number;
    status_totals: Record<string, number>;
    status_last_24h: Record<string, number>;
    channel_totals: Record<string, number>;
    sla_risk_count: number;
    sla_risk_threshold_hours: number;
  };
  sla_risks: Array<{
    lead_id: string;
    name: string;
    email: string;
    status: string;
    hours_without_contact: number;
  }>;
};

async function safeJson(res: Response) {
  return res.json().catch(() => ({}));
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-blue-100 text-blue-700";
    case "queued":
      return "bg-indigo-100 text-indigo-700";
    case "failed":
      return "bg-red-100 text-red-700";
    case "sent":
      return "bg-emerald-100 text-emerald-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    case "replied":
      return "bg-teal-100 text-teal-700";
    default:
      return "bg-zinc-100 text-zinc-700";
  }
}

export default function OutboundCommandCenter() {
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    try {
      const [metricsRes, queueRes] = await Promise.all([
        fetch("/api/admin/outbound/metrics", { cache: "no-store" }),
        fetch("/api/admin/outbound/queue", { cache: "no-store" }),
      ]);
      const metricsData = await safeJson(metricsRes);
      const queueData = await safeJson(queueRes);
      if (!metricsRes.ok) {
        setError((metricsData.error as string) ?? "Failed to load outbound metrics");
        return;
      }
      if (!queueRes.ok) {
        setError((queueData.error as string) ?? "Failed to load outbound queue");
        return;
      }
      setError(null);
      setMetrics(metricsData as MetricsPayload);
      setQueue((queueData.queue ?? []) as QueueRow[]);
    } catch {
      setError("Failed to load outbound command center");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const topStatuses = useMemo(
    () =>
      Object.entries(metrics?.metrics.status_totals ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [metrics],
  );

  async function updateMessageStatus(messageId: string, status: "sent" | "failed" | "delivered" | "replied" | "queued") {
    setUpdating(messageId);
    setError(null);
    const failureReason = status === "failed"
      ? window.prompt("Failure reason", "Delivery failed") ?? ""
      : "";
    const payload = status === "failed"
      ? { status, failure_reason: failureReason }
      : { status };
    const response = await fetch(`/api/admin/outbound-messages/${encodeURIComponent(messageId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(response);
    setUpdating(null);
    if (!response.ok) {
      setError((data.error as string) ?? "Failed to update message");
      return;
    }
    const updated = data.message as QueueRow;
    setQueue((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)).filter((item) => {
        return item.status === "approved" || item.status === "queued" || item.status === "failed";
      }),
    );
    void load();
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading outbound command center…</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Actionable queue</p>
          <p className="mt-1 text-2xl font-semibold">{metrics?.metrics.actionable_queue_count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">SLA risks</p>
          <p className="mt-1 text-2xl font-semibold">{metrics?.metrics.sla_risk_count ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Messages (24h)</p>
          <p className="mt-1 text-2xl font-semibold">
            {Object.values(metrics?.metrics.status_last_24h ?? {}).reduce((acc, value) => acc + value, 0)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Total outbound</p>
          <p className="mt-1 text-2xl font-semibold">{metrics?.metrics.total_outbound_messages ?? 0}</p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Top statuses</h2>
        {topStatuses.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No outbound data yet.</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {topStatuses.map(([status, count]) => (
              <li key={status} className="flex items-center justify-between rounded border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
                <span>{status}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">SLA risk leads</h2>
        {metrics && metrics.sla_risks.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {metrics.sla_risks.map((lead) => (
              <li key={lead.lead_id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-100 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-zinc-500">
                    {lead.email} · {lead.status} · {lead.hours_without_contact}h without contact
                  </p>
                </div>
                <Link href={`/admin/leads/${lead.lead_id}`} className="text-xs font-medium text-emerald-700 hover:underline">
                  Open lead
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            No SLA risk leads above {metrics?.metrics.sla_risk_threshold_hours ?? 6}h right now.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Action queue</h2>
        {queue.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No approved/queued/failed items pending action.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {queue.map((item) => (
              <li key={item.id} className="rounded border border-zinc-100 p-3 text-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {item.leads.first_name} {item.leads.last_name} · {item.channel}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                {item.subject && <p className="mb-1 text-xs text-zinc-600">Subject: {item.subject}</p>}
                <p className="line-clamp-2 text-xs text-zinc-700">{item.body_text}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Attempts {item.attempts}/{item.max_attempts} · Scheduled {new Date(item.scheduled_for).toLocaleString()}
                </p>
                {item.failure_reason && <p className="mt-1 text-xs text-red-600">Failure: {item.failure_reason}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {(item.status === "approved" || item.status === "failed") && (
                    <button
                      type="button"
                      disabled={updating === item.id}
                      onClick={() => updateMessageStatus(item.id, "queued")}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Queue
                    </button>
                  )}
                  {(item.status === "queued" || item.status === "failed" || item.status === "approved") && (
                    <button
                      type="button"
                      disabled={updating === item.id}
                      onClick={() => updateMessageStatus(item.id, "sent")}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Mark sent
                    </button>
                  )}
                  {item.status === "queued" && (
                    <button
                      type="button"
                      disabled={updating === item.id}
                      onClick={() => updateMessageStatus(item.id, "failed")}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Mark failed
                    </button>
                  )}
                  {item.status === "sent" && (
                    <>
                      <button
                        type="button"
                        disabled={updating === item.id}
                        onClick={() => updateMessageStatus(item.id, "delivered")}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Mark delivered
                      </button>
                      <button
                        type="button"
                        disabled={updating === item.id}
                        onClick={() => updateMessageStatus(item.id, "replied")}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Mark replied
                      </button>
                    </>
                  )}
                  <Link href={`/admin/leads/${item.lead_id}`} className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                    Open lead
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
