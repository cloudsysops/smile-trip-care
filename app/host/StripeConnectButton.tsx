"use client";

type Props = {
  disabled: boolean;
};

export default function StripeConnectButton({ disabled }: Props) {
  async function handleClick() {
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
    }
  }

  if (disabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-sky-950 shadow-sm transition hover:bg-sky-400"
    >
      Connect Stripe
    </button>
  );
}

