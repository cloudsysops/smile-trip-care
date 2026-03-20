"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProfileRole } from "@/lib/auth";

import RoleSwitcher from "@/app/components/dashboard/RoleSwitcher";

function roleLabel(role: ProfileRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "coordinator":
      return "Coordinator";
    case "provider_manager":
      return "Provider";
    case "host":
      return "Host";
    case "specialist":
      return "Specialist";
    case "patient":
    case "user":
      return "Patient";
    default:
      return role;
  }
}

type Options = Readonly<{
  availableRoles: ProfileRole[];
  effectiveRole: ProfileRole;
}>;

export default function AdminRoleSwitcher() {
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/role-switcher", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as Options & { ok?: boolean };
        if (!cancelled && Array.isArray(data.availableRoles) && data.effectiveRole) {
          setOptions({ availableRoles: data.availableRoles, effectiveRole: data.effectiveRole });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showSwitcher = useMemo(() => {
    if (!options) return false;
    return options.availableRoles.length > 1;
  }, [options]);

  if (loading || !options) return null;

  return (
    <>
      {showSwitcher ? (
        <RoleSwitcher availableRoles={options.availableRoles} activeRole={options.effectiveRole} />
      ) : (
        <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/50 px-3 py-1 text-xs font-medium text-zinc-200">
          Active: {roleLabel(options.effectiveRole)}
        </span>
      )}
    </>
  );
}

