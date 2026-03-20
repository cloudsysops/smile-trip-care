"use client";

import { useState } from "react";

type Props = Readonly<{
  disabled?: boolean;
  endpoint: "/api/stripe/connect/host/onboarding" | "/api/stripe/connect/specialist/onboarding";
  label?: string;
  loadingLabel?: string;
  className?: string;
}>;

export default function ConnectOnboardingButton({
  disabled = false,
  endpoint,
  label = "Connect Stripe",
  loadingLabel = "Loading...",
  className = "inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-sky-950 shadow-sm transition hover:bg-sky-400",
}: Props) {
  const [connecting, setConnecting] = useState(false);

  async function handleClick() {
    setConnecting(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        globalThis.location.href = data.url;
      }
    } catch {
      // no-op; user can retry
    } finally {
      setConnecting(false);
    }
  }

  if (disabled) return null;

  return (
    <button type="button" onClick={handleClick} disabled={connecting} className={className}>
      {connecting ? loadingLabel : label}
    </button>
  );
}
