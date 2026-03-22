import Link from "next/link";

import { getCurrentProfile, getEffectiveRoleForProfile, type ProfileRole } from "@/lib/auth";
import { getProfileRoles } from "@/lib/services/roles.service";

import RoleSwitcher from "./RoleSwitcher";

export type DashboardMobileNavItem = Readonly<{
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}>;

export type DashboardDesktopNavItem = Readonly<{
  href: string;
  label: string;
  active?: boolean;
}>;

type Props = Readonly<{
  subtitle?: string;
  mobileNav: readonly DashboardMobileNavItem[];
  desktopNav: readonly DashboardDesktopNavItem[];
}>;

function filterRoles(roleRows: Awaited<ReturnType<typeof getProfileRoles>>): ProfileRole[] {
  return roleRows
    .map((r) => r.role)
    .filter(
      (r): r is ProfileRole =>
        r === "admin" ||
        r === "coordinator" ||
        r === "provider_manager" ||
        r === "host" ||
        r === "specialist" ||
        r === "patient" ||
        r === "user",
    );
}

/** Specialist-style top bar: SMILETRIPCARE, nav, bell, avatar, role switcher, sign out. */
export default async function DashboardShellHeader({ subtitle, mobileNav, desktopNav }: Props) {
  const ctx = await getCurrentProfile();
  if (!ctx) return null;

  const { profile } = ctx;
  const activeRole = await getEffectiveRoleForProfile(profile);
  const roleRows = await getProfileRoles(profile.id);
  const roles = filterRoles(roleRows);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 px-3 py-3 backdrop-blur sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <Link href="/" className="shrink-0 text-xs font-semibold tracking-wide text-emerald-300 sm:text-sm">
            SMILETRIPCARE
          </Link>
          {subtitle ? (
            <p className="hidden min-w-0 truncate text-xs text-zinc-300 sm:block sm:text-sm">{subtitle}</p>
          ) : null}
          <nav className="flex items-center gap-1 md:hidden" aria-label="Primary">
            {mobileNav.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`rounded-lg border p-2 text-base leading-none ${
                  item.active ? "border-zinc-700 bg-zinc-900/80 text-emerald-300" : "border-zinc-800 text-zinc-300"
                }`}
                title={item.label}
                aria-current={item.active ? "page" : undefined}
                aria-label={item.label}
              >
                <span aria-hidden>{item.icon}</span>
                <span className="sr-only">{item.label}</span>
              </Link>
            ))}
          </nav>
          <nav className="hidden items-center gap-3 md:flex" aria-label="Section">
            {desktopNav.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`text-sm shrink-0 ${item.active ? "font-medium text-white underline" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button" className="rounded-full border border-zinc-700 p-2 text-zinc-300" aria-label="Notifications">
            🔔
          </button>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[10px] font-semibold text-zinc-200 sm:h-9 sm:w-9 sm:text-xs">
            {(profile.full_name?.[0] ?? profile.email?.[0] ?? "?").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 sm:flex-initial">
            <RoleSwitcher availableRoles={roles} activeRole={activeRole} />
          </div>
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="text-xs text-zinc-400 hover:text-zinc-200 sm:text-sm">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
