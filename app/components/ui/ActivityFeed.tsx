type Item = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  time: string;
};

type Props = Readonly<{ items: Item[] }>;

export default function ActivityFeed({ items }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Live activity</h3>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-400">No events yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 transition-colors hover:bg-zinc-800/40"
            >
              <p className="text-sm text-white">
                <span className="mr-2">{item.icon}</span>
                {item.title}
              </p>
              <p className="text-xs text-zinc-400">{item.subtitle}</p>
              <p className="text-[11px] text-zinc-500">{item.time}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
