"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = Readonly<{
  experienceId: string;
  redirectTo?: string;
}>;

export default function HostExperienceDeleteButton({ experienceId, redirectTo = "/host/experiences" }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!window.confirm("Archive this experience? It will be hidden from your dashboard and the marketplace.")) {
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/host/experiences/${experienceId}`, { method: "DELETE" });
      if (!res.ok) return;
      router.push(redirectTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onDelete()}
      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
    >
      {pending ? "Archiving…" : "Archive experience"}
    </button>
  );
}
