export default function SpecialistProfileLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="h-6 w-52 animate-pulse rounded bg-zinc-800" />
          <div className="h-9 w-44 animate-pulse rounded bg-zinc-800" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-10 h-10 w-2/5 animate-pulse rounded bg-zinc-800" />
        <div className="space-y-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-4 h-4 w-1/2 animate-pulse rounded bg-zinc-800" />
            <div className="h-28 w-full animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="mb-3 h-4 w-2/5 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                <div className="h-20 w-full animate-pulse rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

