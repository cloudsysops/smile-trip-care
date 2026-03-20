"use client";

import { useState } from "react";

type FollowUpType = "24h" | "3d" | "7d";

type Props = Readonly<{
  leadId: string;
  leadPhone?: string | null;
  leadCreatedAt?: string | null;
}>;

function phoneDigits(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(0, 15);
}

const LABELS: Record<FollowUpType, string> = {
  "24h": "24h follow-up",
  "3d": "3 day follow-up",
  "7d": "7 day follow-up",
};

export default function LeadFollowUpSection({ leadId, leadPhone }: Props) {
  const [messages, setMessages] = useState<Partial<Record<FollowUpType, string>>>({});
  const [loading, setLoading] = useState<FollowUpType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate(type: FollowUpType) {
    setError(null);
    setLoading(type);
    try {
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to generate");
        return;
      }
      setMessages((prev) => ({ ...prev, [type]: data.message ?? "" }));
    } catch {
      setLoading(null);
      setError("Request failed");
    }
  }

  function copyToClipboard(text: string, key: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const hasPhone = leadPhone && phoneDigits(leadPhone).length >= 10;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="text-sm font-semibold text-zinc-100">Follow-ups</h2>
      <p className="mt-1 text-xs text-zinc-400">
        Generate 24h, 3-day, and 7-day follow-up message drafts. Copy or open in WhatsApp.
      </p>

      {error && (
        <p className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {(["24h", "3d", "7d"] as const).map((type) => {
          const text = messages[type];
          const isLoading = loading === type;
          return (
            <div key={type} className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">{LABELS[type]}</span>
                {!text && !isLoading && (
                  <button
                    type="button"
                    onClick={() => handleGenerate(type)}
                    className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Generate
                  </button>
                )}
                {isLoading && (
                  <span className="text-xs text-zinc-400">Generating…</span>
                )}
              </div>
              {text && (
                <>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-100">{text}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(text, type)}
                      className="rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800/40"
                    >
                      {copied === type ? "Copied" : "Copy"}
                    </button>
                    {hasPhone && (
                      <a
                        href={`https://wa.me/${phoneDigits(leadPhone)}?text=${encodeURIComponent(text)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800/40"
                      >
                        Open WhatsApp
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
