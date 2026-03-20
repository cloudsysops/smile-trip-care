export default function PackagesLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-zinc-800" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-8 h-10 w-full animate-pulse rounded bg-zinc-900/60" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
              <div className="h-20 w-full animate-pulse rounded bg-zinc-800" />
              <div className="h-9 w-28 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

