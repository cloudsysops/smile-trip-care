"use client";

import Link from "next/link";

type Props = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function SpecialistError({ error, reset }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex max-w-xl flex-col items-center justify-center px-4 py-14 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-300">We couldn&apos;t load your specialist dashboard.</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Try again
          </button>
          <Link
            href="/login?next=/specialist"
            className="rounded-full border border-zinc-800 bg-transparent px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
          >
            Go to login
          </Link>
        </div>

        {process.env.NODE_ENV !== "production" ? (
          <pre className="mt-6 w-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left text-xs text-zinc-200">
            {error.message}
          </pre>
        ) : null}
      </main>
    </div>
  );
}

