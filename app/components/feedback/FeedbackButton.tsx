"use client";

import { useState } from "react";

interface FeedbackButtonProps {
  page: string;
}

export function FeedbackButton({ page }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          message,
          email: email.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setMessage("");
      setEmail("");
      setTimeout(() => {
        setStatus("idle");
        setOpen(false);
      }, 1500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <form
          onSubmit={handleSubmit}
          className="w-80 rounded-2xl border border-zinc-700 bg-zinc-900/95 p-4 text-sm shadow-xl backdrop-blur"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-medium text-zinc-100">Send beta feedback</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
          <p className="mb-3 text-xs text-zinc-400">
            Tell us what&apos;s working well and what feels confusing.
          </p>
          <label className="mb-2 block text-xs font-medium text-zinc-300">
            Your feedback
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="What were you trying to do? What should feel smoother?"
              required
            />
          </label>
          <label className="mb-3 block text-xs text-zinc-400">
            Email (optional)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-50 placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="you@example.com"
            />
          </label>
          {status === "error" && (
            <p className="mb-2 text-xs text-red-400">
              We couldn&apos;t save your feedback. Please try again.
            </p>
          )}
          {status === "submitting" && (
            <p className="mb-2 text-xs text-zinc-400">Loading...</p>
          )}
          {status === "success" && (
            <p className="mb-2 text-xs text-emerald-400">Thank you for your feedback.</p>
          )}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 shadow-sm hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "submitting" ? "Sending..." : "Send feedback"}
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
        aria-label="Send feedback"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span>Send feedback</span>
      </button>
    </div>
  );
}

