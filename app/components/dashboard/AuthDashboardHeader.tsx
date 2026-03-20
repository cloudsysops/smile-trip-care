import Link from "next/link";
import type { ReactNode } from "react";

import { getCurrentProfile, getEffectiveRoleForProfile } from "@/lib/auth";
import { getProfileRoles } from "@/lib/services/roles.service";
import type { ProfileRole } from "@/lib/auth";

import RoleSwitcher from "./RoleSwitcher";
import { shouldShowRoleSwitcher } from "@/lib/role-switcher";

export type NavItem = Readonly<{ href: string; label: string; active?: boolean }>;

type Props = Readonly<{
  title: ReactNode;
  navItems?: readonly NavItem[];
  homeHref?: string;
  homeLabel?: string;
  maxWidth?: string;
  showRoleSwitcher?: boolean;
}>;

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
      return "Patient";
    case "user":
      return "Patient";
    default:
      return role;
  }
}

export default async function AuthDashboardHeader({
  title,
  navItems = [],
  homeHref = "/",
  homeLabel = "Home",
  maxWidth = "max-w-4xl",
  showRoleSwitcher = true,
}: Props) {
  const ctx = await getCurrentProfile();
  if (!ctx) return null;

  const { profile } = ctx;
  const effectiveRole = await getEffectiveRoleForProfile(profile);
  const roleRows = await getProfileRoles(profile.id);
  const availableRoles = roleRows.map((r) => r.role).filter((r): r is ProfileRole => {
    return (
      r === "admin" ||
      r === "coordinator" ||
      r === "provider_manager" ||
      r === "host" ||
      r === "specialist" ||
      r === "patient" ||
      r === "user"
    );
  });

  const showSwitcher = showRoleSwitcher && shouldShowRoleSwitcher(availableRoles);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-4 sm:px-6 backdrop-blur">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between gap-4`}>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href={homeHref}
            className="text-sm font-medium text-zinc-400 hover:text-zinc-100 shrink-0"
          >
            {homeLabel}
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm shrink-0 ${
                item.active ? "font-medium text-zinc-100 underline" : "text-zinc-400 hover:text-zinc-100 hover:underline"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="flex">
            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/50 px-3 py-1 text-xs font-medium text-zinc-200">
              Active: {roleLabel(effectiveRole)}
            </span>
          </div>

          {showSwitcher ? (
            <RoleSwitcher availableRoles={availableRoles} activeRole={effectiveRole} />
          ) : null}

          <div className="flex items-center gap-3">
            <h1 className="truncate text-lg font-semibold text-zinc-100 sm:text-xl">{title}</h1>
            <form action="/api/auth/signout" method="post" className="inline">
              <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-100 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}

