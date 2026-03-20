export default function HealthPackagesLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-6 w-48 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-800" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8">
          <div className="h-10 w-full animate-pulse rounded bg-zinc-900/60" />
        </section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="h-20 w-full animate-pulse rounded bg-zinc-800" />
              <div className="h-9 w-28 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

