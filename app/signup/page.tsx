"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/browser";

function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() || undefined } },
    });
    if (signUpError) {
      setError(signUpError.message || "Sign up failed");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName.trim() || undefined }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data.error as string) || "Could not create account");
      setLoading(false);
      return;
    }
    router.push("/login?next=/patient");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-white">
            Nebula Smile
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Create patient account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            For patients only. You can submit assessments and track your journey.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-zinc-300">
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                placeholder="Your name"
              />
            </div>
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
                minLength={6}
                autoComplete="new-password"
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            <Link href="/login" className="text-zinc-400 hover:text-white">
              Already have an account? Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <span className="text-zinc-500">Loading…</span>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
