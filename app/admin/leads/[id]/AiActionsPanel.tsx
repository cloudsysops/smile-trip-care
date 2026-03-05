"use client";

import { useMemo, useState } from "react";
import type { ItineraryOutput, LeadTriageOutput, SalesResponderOutput } from "@/lib/ai/schemas";

type StoredMessage = SalesResponderOutput & {
  cta_url?: string;
  generated_at?: string;
};

type StoredItinerary = {
  id: string;
  city: string | null;
  content_json: ItineraryOutput | null;
  created_at: string;
};

type Props = {
  leadId: string;
  initialTriage: LeadTriageOutput | null;
  initialMessage: StoredMessage | null;
  initialItineraries: StoredItinerary[];
};

export default function AiActionsPanel({ leadId, initialTriage, initialMessage, initialItineraries }: Props) {
  const [triage, setTriage] = useState<LeadTriageOutput | null>(initialTriage);
  const [message, setMessage] = useState<StoredMessage | null>(initialMessage);
  const [itineraryPreview, setItineraryPreview] = useState<ItineraryOutput | null>(null);
  const [loading, setLoading] = useState<"triage" | "reply" | "itinerary" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const itineraryHistory = useMemo(() => {
    if (!itineraryPreview) return initialItineraries;
    return [
      {
        id: "generated-preview",
        city: itineraryPreview.city,
        content_json: itineraryPreview,
        created_at: new Date().toISOString(),
      },
      ...initialItineraries,
    ];
  }, [initialItineraries, itineraryPreview]);

  async function safeJson(res: Response) {
    return res.json().catch(() => ({}));
  }

  async function handleGenerateTriage() {
    setError(null);
    setLoading("triage");
    const res = await fetch("/api/ai/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    });
    const data = await safeJson(res);
    setLoading(null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to generate triage");
      return;
    }
    setTriage(data.triage ?? null);
  }

  async function handleGenerateReply() {
    setError(null);
    setLoading("reply");
    const res = await fetch("/api/ai/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    });
    const data = await safeJson(res);
    setLoading(null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to generate reply");
      return;
    }
    setMessage(data.message ?? null);
  }

  async function handleGenerateItinerary() {
    setError(null);
    setLoading("itinerary");
    const res = await fetch("/api/ai/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: leadId }),
    });
    const data = await safeJson(res);
    setLoading(null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to generate itinerary");
      return;
    }
    setItineraryPreview(data.itinerary ?? null);
  }

  async function copyToClipboard(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
    } catch {
      setError("Clipboard not available");
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateTriage}
          disabled={loading !== null}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading === "triage" ? "Generating…" : "Generate Triage"}
        </button>
        <button
          type="button"
          onClick={handleGenerateReply}
          disabled={loading !== null}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading === "reply" ? "Generating…" : "Generate Reply"}
        </button>
        <button
          type="button"
          onClick={handleGenerateItinerary}
          disabled={loading !== null}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading === "itinerary" ? "Generating…" : "Generate Itinerary"}
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3 rounded border border-zinc-200 p-4">
        <h3 className="font-semibold">Latest triage</h3>
        {triage ? (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-zinc-600">Priority:</span> {triage.priority}</p>
            <p><span className="font-medium text-zinc-600">Recommended city:</span> {triage.recommended_city}</p>
            <p><span className="font-medium text-zinc-600">Next step:</span> {triage.next_step}</p>
            <div>
              <p className="font-medium text-zinc-600">Questions to ask</p>
              <ul className="list-inside list-disc">
                {triage.questions_to_ask.length > 0 ? (
                  triage.questions_to_ask.map((q) => <li key={q}>{q}</li>)
                ) : (
                  <li>No additional questions</li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No triage generated yet.</p>
        )}
      </div>

      <div className="space-y-3 rounded border border-zinc-200 p-4">
        <h3 className="font-semibold">Latest sales reply</h3>
        {message ? (
          <div className="space-y-4 text-sm">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium text-zinc-600">WhatsApp message</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(message.whatsapp_message, "wa")}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
                >
                  {copiedKey === "wa" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="whitespace-pre-wrap rounded bg-zinc-50 p-2">{message.whatsapp_message}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium text-zinc-600">Email subject</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(message.email_subject, "subject")}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
                >
                  {copiedKey === "subject" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="rounded bg-zinc-50 p-2">{message.email_subject}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium text-zinc-600">Email body</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(message.email_body, "email")}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
                >
                  {copiedKey === "email" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="whitespace-pre-wrap rounded bg-zinc-50 p-2">{message.email_body}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No reply generated yet.</p>
        )}
      </div>

      <div className="space-y-3 rounded border border-zinc-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Itineraries history</h3>
          <button
            type="button"
            onClick={() => copyToClipboard(JSON.stringify(itineraryHistory, null, 2), "itinerary-json")}
            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50"
          >
            {copiedKey === "itinerary-json" ? "Copied" : "Copy JSON"}
          </button>
        </div>
        {itineraryHistory.length === 0 ? (
          <p className="text-sm text-zinc-600">No itinerary generated yet.</p>
        ) : (
          <ul className="space-y-3">
            {itineraryHistory.map((row) => (
              <li key={row.id} className="rounded border border-zinc-200 p-3 text-sm">
                <p className="text-xs text-zinc-500">
                  {new Date(row.created_at).toLocaleString()} · {row.city ?? "Unknown city"}
                </p>
                {row.content_json?.day_by_day ? (
                  <ul className="mt-2 space-y-1">
                    {row.content_json.day_by_day.map((day) => (
                      <li key={`${row.id}-${day.day}`}>
                        <span className="font-medium">Day {day.day}:</span> {day.morning}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-zinc-600">No itinerary detail stored.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
