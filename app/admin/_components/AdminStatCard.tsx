import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  href?: string;
  className?: string;
}>;

export default function AdminStatCard({ label, value, helper, href, className }: Props) {
  const content = (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 ${className ?? ""}`}
    >
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-100">{value}</p>
      {helper ? <div className="mt-1 text-xs text-zinc-400">{helper}</div> : null}
    </div>
  );

  if (href) {
    return (
      <div>
        {content}
        <Link href={href} className="mt-2 inline-block text-sm text-emerald-300 hover:underline">
          Ver detalles →
        </Link>
      </div>
    );
  }

  return content;
}

