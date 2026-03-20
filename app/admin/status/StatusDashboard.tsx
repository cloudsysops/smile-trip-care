"use client";

import { useEffect, useState } from "react";

type HealthRes = { status: string; timestamp: string; service?: string };
type ReadyRes = { ready: boolean; timestamp: string; checks: Record<string, string> };
type PaymentsMetricsRes = { metrics: Record<string, number>; request_id: string };
type AutomationRes = {
  pending_jobs: number;
  processing_jobs: number;
  retry_jobs: number;
  dead_letter_jobs: number;
  oldest_job_age: number;
  failed_outbound_count: number;
};

export default function StatusDashboard() {
  const [live, setLive] = useState<HealthRes | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [ready, setReady] = useState<ReadyRes | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [readyLoading, setReadyLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentsMetricsRes | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [automation, setAutomation] = useState<AutomationRes | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [automationLoading, setAutomationLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setLive)
      .catch(() => setLiveError("Failed to fetch"))
      .finally(() => setLiveLoading(false));
    fetch("/api/health/ready")
      .then((r) => r.json())
      .then(setReady)
      .catch(() => setReadyError("Failed to fetch"))
      .finally(() => setReadyLoading(false));
    fetch("/api/admin/payments/metrics")
      .then((r) => r.json())
      .then((payload) => {
        if (!payload || typeof payload !== "object" || !("metrics" in payload)) {
          throw new Error("Invalid payload");
        }
        setPayments(payload as PaymentsMetricsRes);
      })
      .catch(() => setPaymentsError("Failed to fetch"))
      .finally(() => setPaymentsLoading(false));
    fetch("/api/admin/status/automation")
      .then((r) => r.json())
      .then((payload) => {
        if (payload && typeof payload === "object" && "error" in payload) {
          setAutomationError(String((payload as { error?: unknown }).error ?? "Failed to fetch"));
          return;
        }
        setAutomation(payload as AutomationRes);
      })
      .catch(() => setAutomationError("Failed to fetch"))
      .finally(() => setAutomationLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Liveness</h2>
        <p className="mt-1 text-sm text-zinc-400">GET /api/health — process is running.</p>
        {liveLoading && <p className="mt-2 text-sm text-zinc-400">Loading...</p>}
        {liveError && <p className="mt-2 text-sm text-red-600">{liveError}</p>}
        {live && (
          <pre className="mt-2 overflow-auto rounded bg-zinc-900/40 p-3 text-xs text-zinc-200">
            {JSON.stringify(live, null, 2)}
          </pre>
        )}
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Readiness</h2>
        <p className="mt-1 text-sm text-zinc-400">GET /api/health/ready — DB and config.</p>
        {readyLoading && <p className="mt-2 text-sm text-zinc-400">Loading...</p>}
        {readyError && <p className="mt-2 text-sm text-red-600">{readyError}</p>}
        {ready && (
          <>
            <p className="mt-2 text-sm">
              Ready: <span className={ready.ready ? "text-green-400" : "text-red-400"}>{String(ready.ready)}</span>
            </p>
            <pre className="mt-2 overflow-auto rounded bg-zinc-900/40 p-3 text-xs text-zinc-200">
              {JSON.stringify(ready, null, 2)}
            </pre>
          </>
        )}
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Automation status</h2>
        <p className="mt-1 text-sm text-zinc-400">GET /api/admin/status/automation — queue and outbound reliability.</p>
        {automationLoading && <p className="mt-2 text-sm text-zinc-400">Loading...</p>}
        {automationError && <p className="mt-2 text-sm text-red-600">{automationError}</p>}
        {automation && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-200">
              <p><span className="font-medium">Pending jobs:</span> {automation.pending_jobs}</p>
              <p><span className="font-medium">Processing jobs:</span> {automation.processing_jobs}</p>
              <p><span className="font-medium">Retry jobs:</span> {automation.retry_jobs}</p>
              <p><span className="font-medium">Dead letter jobs:</span> {automation.dead_letter_jobs}</p>
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-900/40 p-3 text-sm text-zinc-200">
              <p><span className="font-medium">Oldest job age (s):</span> {automation.oldest_job_age}</p>
              <p><span className="font-medium">Failed outbound:</span> {automation.failed_outbound_count}</p>
            </div>
          </div>
        )}
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-zinc-100">Payments reliability</h2>
        <p className="mt-1 text-sm text-zinc-400">
          GET /api/admin/payments/metrics — pending aging, recoveries, and webhook processing.
        </p>
        {paymentsLoading && <p className="mt-2 text-sm text-zinc-400">Loading...</p>}
        {paymentsError && <p className="mt-2 text-sm text-red-600">{paymentsError}</p>}
        {payments && (
          <pre className="mt-2 overflow-auto rounded bg-zinc-900/40 p-3 text-xs text-zinc-200">
            {JSON.stringify(payments, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
