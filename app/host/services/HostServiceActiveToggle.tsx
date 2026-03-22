"use client";

import { useState } from "react";

type Props = Readonly<{
  serviceId: string;
  initialActive: boolean;
}>;

export default function HostServiceActiveToggle({ serviceId, initialActive }: Props) {
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const next = !active;
    try {
      const res = await fetch(`/api/host/services/${encodeURIComponent(serviceId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (res.ok) setActive(next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void toggle()}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors ${
        active ? "border-emerald-500/50 bg-emerald-500/20" : "border-zinc-600 bg-zinc-800"
      }`}
      aria-pressed={active}
      aria-label={active ? "Active on marketplace" : "Inactive"}
    >
      <span
        className={`pointer-events-none absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          active ? "left-5" : "left-0.5"
        }`}
      />
      <span className="sr-only">{active ? "Active" : "Inactive"}</span>
    </button>
  );
}
