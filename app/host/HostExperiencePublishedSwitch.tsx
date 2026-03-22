"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = Readonly<{
  experienceId: string;
  initialPublished: boolean;
}>;

export default function HostExperiencePublishedSwitch({ experienceId, initialPublished }: Props) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !published;
    setPending(true);
    try {
      const res = await fetch(`/api/host/experiences/${experienceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      if (!res.ok) {
        return;
      }
      setPublished(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      disabled={pending}
      onClick={() => void toggle()}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border transition-colors ${
        published ? "border-emerald-500/60 bg-emerald-500/20" : "border-zinc-600 bg-zinc-800"
      } ${pending ? "opacity-50" : ""}`}
    >
      <span
        className={`mt-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          published ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span className="sr-only">{published ? "Active on marketplace" : "Inactive"}</span>
    </button>
  );
}
