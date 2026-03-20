"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { branding } from "@/lib/branding";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "";
  const message = searchParams?.get("message") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // If already authenticated with a valid profile, redirect to dashboard by role.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled || !res.ok) return;
        const data = (await res.json()) as { redirectPath?: string };
        const target = next || data.redirectPath || "/patient";
        router.replace(target);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function handleGoogleSignIn() {
    setError(null);
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError("Auth not configured.");
      return;
    }
    try {
      setOauthLoading(true);
      const origin = globalThis.location.origin;
      const callbackUrl = new URL("/auth/callback", origin);
      if (next) {
        callbackUrl.searchParams.set("next", next);
      }
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });
    } catch (e) {
      console.error(e);
      setError("Could not start Google sign-in. Please try again.");
      setOauthLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      const msg = err.message ?? "";
      const needsConfirm =
        msg.toLowerCase().includes("confirm") ||
        msg.toLowerCase().includes("not confirmed") ||
        (err as { code?: string }).code === "email_not_confirmed";
      setError(
        needsConfirm
          ? "Please confirm your email first. Check your inbox and spam folder, then try again."
          : "Invalid email or password"
      );
      setLoading(false);
      return;
    }
    // Let server-side /auth/callback ensure profile exists and redirect by role.
    // Avoids race with session cookie and handles missing profile (creates patient).
    const callbackUrl = next
      ? `/auth/callback?next=${encodeURIComponent(next)}`
      : "/auth/callback";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-lg font-semibold text-white hover:text-zinc-200">
            {branding.productName}
          </Link>
          <Link href="/" className="inline-flex min-h-[44px] items-center text-sm font-medium text-zinc-400 hover:text-white">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
            <h1 className="font-serif text-2xl font-normal tracking-tight text-white md:text-3xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Use your account to access your dashboard. Patient accounts can be created via sign up; team accounts are created by the admin.
            </p>

            {message === "confirm_email" && (
              <p className="mt-4 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200" aria-live="polite">
                Check your email to confirm your account, then sign in below.
              </p>
            )}

            <div className="mt-6 border-b border-zinc-800 pb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={oauthLoading}
                className="w-full min-h-[44px] rounded-xl border border-zinc-700 bg-zinc-800/50 py-3 text-sm font-medium text-white hover:bg-zinc-800/80 disabled:opacity-60"
                aria-label="Continue with Google"
              >
                {oauthLoading ? "Redirecting to Google…" : "Continue with Google"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                  className="mt-2 w-full rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                  className="mt-2 w-full rounded-xl border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                className="w-full min-h-[48px] rounded-full bg-white py-3.5 text-base font-semibold text-zinc-900 shadow-md hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-zinc-500">
              Secure sign-in. Your data is protected.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            <Link href="/" className="text-zinc-400 hover:text-white">Back to home</Link>
            {" · "}
            <Link href="/signup" className="text-zinc-400 hover:text-white">Create patient account</Link>
            {" · "}
            <Link href="/assessment" className="text-zinc-400 hover:text-white">Free assessment</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <span className="text-zinc-500">Loading…</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
