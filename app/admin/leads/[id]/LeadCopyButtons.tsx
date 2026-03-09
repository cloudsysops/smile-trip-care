"use client";

import { useState } from "react";
import { branding } from "@/lib/branding";

type Props = {
  firstName: string;
  lastName: string;
  email: string;
};

export default function LeadCopyButtons({ firstName, lastName }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const name = [firstName, lastName].filter(Boolean).join(" ") || "there";

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("error");
    }
  }

  const introMessage = `Hi ${name},\n\nThank you for your interest in ${branding.productName}. We've received your details and will be in touch within 24 hours. If you have any questions in the meantime, feel free to reply to this email or message us on WhatsApp.\n\nBest,\n${branding.productName} Team`;

  const depositInvitation = `Hi ${name},\n\nTo secure your spot we need a deposit. You can pay securely via the link we'll send you. Once the deposit is received, we'll confirm your booking and send you the next steps for travel coordination.\n\nBest,\n${branding.productName} Team`;

  const followUpReminder = `Hi ${name},\n\nJust following up on your ${branding.productName} request. We'd love to help you with the next steps. Reply to this email or message us on WhatsApp when you're ready.\n\nBest,\n${branding.productName} Team`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold">Quick copy</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Copy messages to send by email or WhatsApp.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(introMessage, "intro")}
          className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          {copied === "intro" ? "Copied!" : "Intro message"}
        </button>
        <button
          type="button"
          onClick={() => copy(depositInvitation, "deposit")}
          className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          {copied === "deposit" ? "Copied!" : "Deposit invitation"}
        </button>
        <button
          type="button"
          onClick={() => copy(followUpReminder, "followup")}
          className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          {copied === "followup" ? "Copied!" : "Follow-up reminder"}
        </button>
      </div>
    </div>
  );
}
