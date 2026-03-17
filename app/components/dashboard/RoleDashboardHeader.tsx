import Link from "next/link";

export type NavItem = Readonly<{ href: string; label: string; active?: boolean }>;

type Props = Readonly<{
  title: string;
  navItems?: readonly NavItem[];
  homeHref?: string;
  homeLabel?: string;
  maxWidth?: string;
}>;

/**
 * Reusable header for role dashboards (specialist, coordinator, provider).
 * Includes nav links and Sign out. Use with consistent max-w and padding.
 */
export default function RoleDashboardHeader({
  title,
  navItems = [],
  homeHref = "/",
  homeLabel = "Home",
  maxWidth = "max-w-4xl",
}: Props) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 px-4 py-4 sm:px-6 backdrop-blur">
      <div className={`mx-auto flex ${maxWidth} items-center justify-between gap-4`}>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link href={homeHref} className="text-sm font-medium text-zinc-400 hover:text-zinc-100 shrink-0">
            {homeLabel}
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm shrink-0 ${
                item.active
                  ? "font-medium text-zinc-100 underline"
                  : "text-zinc-400 hover:text-zinc-100 hover:underline"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <h1 className="truncate text-lg font-semibold text-zinc-100 sm:text-xl">{title}</h1>
          <form action="/api/auth/signout" method="post" className="inline">
            <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-100 hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
