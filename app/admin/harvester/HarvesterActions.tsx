"use client";

import { useState } from "react";

type Props = Readonly<{
  leadId: string;
  postText: string;
  keyword: string;
  deterministicReply: string;
  url: string | null;
  replied?: boolean;
  onMarkReplied?: (id: string, replied: boolean) => void;
  onAiUsed?: () => void;
}>;

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; reply: string; fallbackUsed: boolean }
  | { status: "error"; message: string };

export default function HarvesterActions({
  leadId,
  postText,
  keyword,
  deterministicReply,
  url,
  replied = false,
  onMarkReplied,
  onAiUsed,
}: Props) {
  const [ai, setAi] = useState<AiState>({ status: "idle" });
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [localReplied, setLocalReplied] = useState(replied);
  const isReplied = localReplied;

  async function handleGenerateClick() {
    if (!postText.trim()) {
      setAi({ status: "error", message: "Post content is empty." });
      return;
    }
    setAi({ status: "loading" });
    setCopyFeedback(null);
    try {
      const res = await fetch("/api/ai/reply-suggestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postText, keyword }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        const message =
          typeof data.error === "string" && data.error.trim().length > 0
            ? data.error
            : "Failed to generate AI reply.";
        setAi({ status: "error", message });
        return;
      }
      const data = (await res.json()) as { reply: string; fallbackUsed: boolean };
      setAi({
        status: "success",
        reply: data.reply,
        fallbackUsed: data.fallbackUsed,
      });
      if (!data.fallbackUsed) onAiUsed?.();
    } catch {
      setAi({
        status: "error",
        message: "Could not reach AI service. You can still use the template reply.",
      });
    }
  }

  async function handleMarkRepliedClick() {
    const next = !isReplied;
    try {
      const res = await fetch("/api/admin/harvester/mark-replied", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, replied: next }),
      });
      if (res.ok) {
        setLocalReplied(next);
        onMarkReplied?.(leadId, next);
      }
    } catch {
      // keep UI unchanged
    }
  }

  async function handleCopyClick() {
    const textToCopy =
      ai.status === "success" && ai.reply.trim().length > 0
        ? ai.reply
        : deterministicReply;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyFeedback("Copied");
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch {
      setCopyFeedback("Could not copy");
      setTimeout(() => setCopyFeedback(null), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={ai.status === "loading"}
          className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800/40 disabled:opacity-60"
        >
          {ai.status === "loading" ? "Generating…" : "Generate AI reply"}
        </button>
        <button
          type="button"
          onClick={handleCopyClick}
          className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800/40"
          title="Copy the AI or template reply"
        >
          Copy reply
        </button>
        <button
          type="button"
          onClick={handleMarkRepliedClick}
          className={
            isReplied
              ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300"
              : "rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800/40"
          }
        >
          {isReplied ? "Replied" : "Mark replied"}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
          >
            Open post
          </a>
        )}
      </div>
      {ai.status === "success" && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-200">
          <p className="font-medium">
            AI reply{" "}
            {ai.fallbackUsed ? "(template used as fallback)" : "(generated)"}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{ai.reply}</p>
        </div>
      )}
      {ai.status === "error" && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">
          {ai.message}
        </div>
      )}
      {copyFeedback && (
        <p className="text-[11px] text-zinc-400" aria-live="polite">
          {copyFeedback}
        </p>
      )}
      <p className="text-[10px] text-zinc-400">
        Lead ID: <span className="font-mono">{leadId.slice(0, 8)}…</span>
      </p>
    </div>
  );
}

