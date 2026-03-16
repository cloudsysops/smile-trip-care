type Props = Readonly<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}>;

export default function EmptyState({ title, description, action, className }: Props) {
  return (
    <div
      className={
        className ??
        "flex flex-col items-center justify-center px-6 py-10 text-center text-sm text-zinc-500"
      }
    >
      <p className="text-sm font-medium text-zinc-700">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

