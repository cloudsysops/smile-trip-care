"use client";

import { useState } from "react";

type Props = {
  disabled: boolean;
};

export default function StripeConnectButton({ disabled }: Props) {
  const [connecting, setConnecting] = useState(false);

  async function handleClick() {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect/host/onboarding", {
        method: "POST",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Swallow error; user can retry.
    } finally {
      setConnecting(false);
    }
  }

  if (disabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={connecting}
      className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-sky-950 shadow-sm transition hover:bg-sky-400"
    >
      {connecting ? "Loading..." : "Connect Stripe"}
    </button>
  );
}

