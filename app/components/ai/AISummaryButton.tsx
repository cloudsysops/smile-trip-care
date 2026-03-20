"use client";

import { useEffect, useMemo, useState } from "react";
import type { LeadAnalysis } from "@/lib/services/ai/lead-ai.service";

type ApiResponse = Readonly<{
  success: boolean;
  data?: LeadAnalysis;
  error?: string;
}>;

type ErrorState =
  | Readonly<{ kind: "rate_limited"; message: string }>
  | Readonly<{ kind: "timeout"; message: string }>
  | Readonly<{ kind: "other"; message: string }>;

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function getIntentBadgeClasses(intent: LeadAnalysis["intent"]): string {
  // Badge color is based on urgency / priority.
  switch (intent) {
    case "urgent_medical":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    case "cosmetic_tourism":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "price_comparison":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "just_browsing":
      return "border-zinc-700 bg-zinc-800 text-zinc-200";
    case "unknown":
    default:
      return "border-zinc-700 bg-zinc-800 text-zinc-300";
  }
}

function getRecommendedActionIcon(action: LeadAnalysis["action"]): string {
  switch (action) {
    case "immediate_call":
      return "📞";
    case "send_quote":
      return "💬";
    case "nurture_email":
      return "✉️";
    case "assign_specialist":
      return "🧑‍⚕️";
    case "manual_review":
      return "📝";
    default:
      return "🤖";
  }
}

function Spinner({ label }: Readonly<{ label: string }>) {
  return (
    <span className="inline-flex items-center gap-2" aria-label={label} role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-200" />
    </span>
  );
}

type Props = Readonly<{
  leadId: string;
  endpointPath?: string;
}>;

export default function AISummaryButton({ leadId, endpointPath = "/api/ai/lead-triage" }: Props) {
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const [cooldownNowMs, setCooldownNowMs] = useState<number>(() => Date.now());

  const cooldownActive = useMemo(() => {
    if (!cooldownUntilMs) return false;
    return cooldownNowMs < cooldownUntilMs;
  }, [cooldownUntilMs, cooldownNowMs]);

  const cooldownSecondsLeft = useMemo(() => {
    if (!cooldownUntilMs) return 0;
    return Math.max(0, Math.ceil((cooldownUntilMs - cooldownNowMs) / 1000));
  }, [cooldownUntilMs, cooldownNowMs]);

  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [data, setData] = useState<LeadAnalysis | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [analyzedAtIso, setAnalyzedAtIso] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<"error" | "info">("error");

  useEffect(() => {
    if (!cooldownUntilMs) return;
    const id = window.setInterval(() => {
      setCooldownNowMs(Date.now());
    }, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntilMs]);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  async function generate() {
    if (loading) return;
    if (cooldownActive) return;

    const now = Date.now();
    setCooldownUntilMs(now + 5000);
    setCooldownNowMs(now);

    setLoading(true);
    setError(null);
    setToastMessage(null);
    setPanelOpen(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const res = await fetch(endpointPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
        signal: controller.signal,
      });

      const json = (await res.json().catch(() => null)) as ApiResponse | null;

      if (res.status === 429) {
        const message = json?.error ?? "Rate limit exceeded. Please wait a moment and try again.";
        setError({ kind: "rate_limited", message });
        setToastKind("error");
        setToastMessage(message);
        return;
      }

      if (!res.ok) {
        const message = json?.error ?? `Request failed with status ${res.status}.`;
        setError({ kind: "other", message });
        setToastKind("error");
        setToastMessage(message);
        return;
      }

      if (!json?.success || !json.data) {
        const message = json?.error ?? "AI response missing or invalid.";
        setError({ kind: "other", message });
        setToastKind("error");
        setToastMessage(message);
        return;
      }

      setData(json.data);
      setError(null);
      setAnalyzedAtIso(new Date().toISOString());
      setToastKind("info");
      setToastMessage("AI summary generated.");
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "Request timed out. You can retry."
          : err instanceof Error
            ? err.message
            : "Request failed. Please try again.";

      if (message.toLowerCase().includes("timeout")) {
        setError({ kind: "timeout", message });
      } else {
        setError({ kind: "other", message });
      }

      setToastKind("error");
      setToastMessage(message);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  const canClick = !loading && !cooldownActive;
  const buttonLabel = cooldownActive ? `Retry in ${cooldownSecondsLeft}s` : "Generate AI Summary";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={!canClick}
          aria-label="Generate AI Summary"
          className={[
            "inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition",
            canClick
              ? "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100"
              : "cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-500",
          ].join(" ")}
        >
          <span aria-hidden="true">🤖</span>
          <span>{buttonLabel}</span>
          {loading && <Spinner label="Generating AI summary" />}
        </button>

        <div className="text-xs text-zinc-400">
          {cooldownActive ? (
            <span aria-live="polite">Cooldown active: {cooldownSecondsLeft}s</span>
          ) : (
            <span>Genera resumen para triage interno.</span>
          )}
        </div>
      </div>

      {/* Result panel */}
      {panelOpen && (
        <section
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5"
          aria-label="AI summary results"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">AI Summary</h3>
              <p className="mt-1 text-xs text-zinc-400">Auto-triage for lead handling.</p>
            </div>

            <button
              type="button"
              className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
              onClick={() => setPanelOpen(false)}
              aria-label="Collapse AI summary panel"
            >
              Collapse
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {loading && (
              <div className="space-y-3" aria-label="Loading AI summary">
                <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-2/5 animate-pulse rounded bg-zinc-800" />
                <div className="mt-2 h-9 w-full animate-pulse rounded bg-zinc-800" />
              </div>
            )}

            {!loading && error?.kind === "rate_limited" && (
              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="text-sm font-medium text-amber-200">{error.message}</p>
              </div>
            )}

            {!loading && error?.kind === "timeout" && (
              <div className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
                <p className="text-sm font-medium text-zinc-100">{error.message}</p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-900"
                  onClick={() => void generate()}
                  disabled={!canClick}
                  aria-label="Retry AI generation"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && error?.kind === "other" && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3">
                <p className="text-sm font-medium text-red-200">{error.message}</p>
              </div>
            )}

            {!loading && data && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Summary</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{data.summary}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Intent</p>
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        getIntentBadgeClasses(data.intent),
                      ].join(" ")}
                      aria-label={`Intent: ${data.intent}`}
                    >
                      {data.intent}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400">
                    {analyzedAtIso ? `Analyzed: ${formatTimestamp(analyzedAtIso)}` : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Recommended Action
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-100"
                      aria-label={`Action: ${data.action}`}
                    >
                      <span className="mr-2" aria-hidden="true">
                        {getRecommendedActionIcon(data.action)}
                      </span>
                      {data.action}
                    </span>
                    {data.priority ? (
                      <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-xs text-zinc-300">
                        priority: {data.priority}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          className={[
            "fixed right-4 top-24 z-50 w-[min(92vw,420px)] rounded-lg border px-4 py-3 shadow",
            toastKind === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-100"
              : "border-sky-500/30 bg-sky-500/10 text-sky-100",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium">{toastMessage}</p>
            <button
              type="button"
              className="text-xs text-zinc-300 hover:text-zinc-100"
              aria-label="Dismiss notification"
              onClick={() => setToastMessage(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

