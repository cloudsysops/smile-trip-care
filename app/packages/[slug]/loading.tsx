export default function PackageLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-5">
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-800" />
          <div className="h-5 w-32 animate-pulse rounded bg-zinc-800" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 h-6 w-52 animate-pulse rounded bg-zinc-800" />
        <div className="mb-8 h-4 w-full animate-pulse rounded bg-zinc-800" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-24 w-full animate-pulse rounded bg-zinc-800" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
              <div className="h-10 w-full animate-pulse rounded bg-zinc-800" />
              <div className="mt-3 h-10 w-full animate-pulse rounded bg-zinc-800" />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
              <div className="mt-3 h-24 w-full animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

