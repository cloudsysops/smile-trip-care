"use client";

import { useState } from "react";

type Props = { leadId: string; amountCents: number | null };

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function PatientDepositButton({ leadId, amountCents }: Props) {
  const [loading, setLoading] = useState(false);
  const amount = amountCents != null && amountCents > 0 ? amountCents : 50000;

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? "Redirecting…" : `Pay deposit (${formatUsd(amount)})`}
    </button>
  );
}
