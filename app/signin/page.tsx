"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/browser";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/admin/leads";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Auth not configured.");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const target = next || data.redirectPath || "/admin";
        router.push(target);
        router.refresh();
        return;
      }
    } catch {
      /* fallback */
    }
    router.push(next || "/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            Nebula Smile
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Use your admin account to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white py-3.5 text-base font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            <Link href="/" className="text-zinc-400 hover:text-white">
              ← Back to home
            </Link>
            {" · "}
            <Link href="/assessment" className="text-zinc-400 hover:text-white">
              Start free assessment
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <span className="text-zinc-500">Loading…</span>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
