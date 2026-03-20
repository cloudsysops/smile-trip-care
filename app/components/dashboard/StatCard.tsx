import Link from "next/link";
import type { ReactNode } from "react";

type Props = Readonly<{
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  href?: string;
  className?: string;
}>;

export default function StatCard({ label, value, helper, href, className }: Props) {
  const content = (
    <div className={`rounded-lg border border-zinc-200 bg-white p-5 ${className ?? ""}`}>
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {helper ? <div className="mt-1 text-xs text-zinc-500">{helper}</div> : null}
    </div>
  );

  if (href) {
    return (
      <div>
        {content}
        <Link href={href} className="mt-2 inline-block text-sm text-emerald-600 hover:underline">
          Ver detalles →
        </Link>
      </div>
    );
  }

  return content;
}

