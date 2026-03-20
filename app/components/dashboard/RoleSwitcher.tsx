"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProfileRole } from "@/lib/auth";

const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "Admin",
  coordinator: "Coordinator",
  provider_manager: "Provider",
  host: "Host",
  specialist: "Specialist",
  patient: "Patient",
  user: "Patient",
};

type Props = Readonly<{
  availableRoles: ProfileRole[];
  activeRole: ProfileRole;
}>;

export default function RoleSwitcher({ availableRoles, activeRole }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const options = useMemo(() => {
    return availableRoles.map((r) => ({
      value: r,
      label: ROLE_LABELS[r] ?? r,
    }));
  }, [availableRoles]);

  async function handleChange(nextRole: ProfileRole) {
    if (loading || nextRole === activeRole) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/active-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.redirectPath) return;
      router.push(data.redirectPath);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex">
        <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/50 px-3 py-1 text-xs font-medium text-zinc-200">
          Active: {ROLE_LABELS[activeRole] ?? activeRole}
        </span>
      </div>
      {options.length === 0 && (
        <p className="text-xs text-zinc-400">No roles yet.</p>
      )}
      <select
        aria-label="Switch active role"
        value={activeRole}
        disabled={loading || options.length === 0}
        onChange={(e) => void handleChange(e.target.value as ProfileRole)}
        className="h-9 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 text-sm text-zinc-100 outline-none transition hover:border-emerald-400/70 focus:border-emerald-400/70 disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

