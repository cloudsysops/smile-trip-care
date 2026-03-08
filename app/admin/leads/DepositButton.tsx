"use client";

import { useState } from "react";

const DEFAULT_CENTS = 50_000;

type Props = {
  leadId: string;
  amountCents?: number | null;
};

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function DepositButton({ leadId, amountCents }: Props) {
  const [loading, setLoading] = useState(false);
  const effectiveAmount = Number.isInteger(amountCents) && (amountCents ?? 0) > 0
    ? (amountCents as number)
    : DEFAULT_CENTS;

  async function handleClick() {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          success_url: `${origin}/admin/leads/${leadId}?paid=1`,
          cancel_url: `${origin}/admin/leads/${leadId}`,
        }),
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
      className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? "Redirecting…" : `Collect deposit (${formatUsd(effectiveAmount)})`}
    </button>
  );
}
