import type { ReactNode } from "react";

type Props = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}>;

export function DashboardHeader({ title, description, actions }: Omit<Props, "children" | "className">) {
  return (
    <div className="flex flex-col gap-3 border-b border-zinc-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-100">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function DashboardSection({
  title,
  description,
  children,
  className,
}: Readonly<{
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section className={className}>
      {title ? (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export default function DashboardLayout({ title, description, actions, children, className }: Props) {
  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      <DashboardHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

