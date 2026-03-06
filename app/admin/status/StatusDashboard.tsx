"use client";

import { useEffect, useState } from "react";

type HealthRes = { status: string; timestamp: string; service?: string };
type ReadyRes = { ready: boolean; timestamp: string; checks: Record<string, string> };

export default function StatusDashboard() {
  const [live, setLive] = useState<HealthRes | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [ready, setReady] = useState<ReadyRes | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setLive)
      .catch(() => setLiveError("Failed to fetch"));
    fetch("/api/health/ready")
      .then((r) => r.json())
      .then(setReady)
      .catch(() => setReadyError("Failed to fetch"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Liveness</h2>
        <p className="mt-1 text-sm text-zinc-500">GET /api/health — process is running.</p>
        {liveError && <p className="mt-2 text-sm text-red-600">{liveError}</p>}
        {live && (
          <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-3 text-xs">
            {JSON.stringify(live, null, 2)}
          </pre>
        )}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Readiness</h2>
        <p className="mt-1 text-sm text-zinc-500">GET /api/health/ready — DB and config.</p>
        {readyError && <p className="mt-2 text-sm text-red-600">{readyError}</p>}
        {ready && (
          <>
            <p className="mt-2 text-sm">
              Ready: <span className={ready.ready ? "text-green-600" : "text-red-600"}>{String(ready.ready)}</span>
            </p>
            <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-3 text-xs">
              {JSON.stringify(ready, null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
