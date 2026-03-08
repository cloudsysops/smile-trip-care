"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AdminSection = "leads" | "outbound" | "assets" | "status";

type Props = {
  title: ReactNode;
  children: ReactNode;
  currentSection?: AdminSection;
  headerLeading?: ReactNode;
  headerActions?: ReactNode;
  headerContainerClassName?: string;
  mainContainerClassName?: string;
  showNavigation?: boolean;
  showSignOut?: boolean;
};

const NAV_ITEMS: Array<{ section: AdminSection; href: string; label: string }> = [
  { section: "leads", href: "/admin/leads", label: "Leads" },
  { section: "outbound", href: "/admin/outbound", label: "Outbound" },
  { section: "assets", href: "/admin/assets", label: "Assets" },
  { section: "status", href: "/admin/status", label: "Status" },
];

function navItemClass(isActive: boolean) {
  if (isActive) {
    return "font-medium text-zinc-900";
  }
  return "text-zinc-600 hover:underline";
}

export default function AdminShell({
  title,
  children,
  currentSection,
  headerLeading,
  headerActions,
  headerContainerClassName = "max-w-5xl",
  mainContainerClassName = "max-w-5xl",
  showNavigation = true,
  showSignOut = true,
}: Props) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className={`mx-auto flex ${headerContainerClassName} items-center justify-between gap-4`}>
          <div className="flex min-w-0 items-center gap-4">
            {headerLeading}
            <h1 className="truncate text-xl font-semibold">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-sm">
            {headerActions}
            {showNavigation &&
              NAV_ITEMS.map((item) => (
                <Link
                  key={item.section}
                  href={item.href}
                  className={navItemClass(currentSection === item.section)}
                >
                  {item.label}
                </Link>
              ))}
            {showSignOut && (
              <form action="/api/auth/signout" method="post" className="inline">
                <button type="submit" className="text-zinc-600 hover:underline">
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className={`mx-auto ${mainContainerClassName} px-6 py-8`}>{children}</main>
    </div>
  );
}
