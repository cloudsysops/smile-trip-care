import Link from "next/link";
import { getPublishedPackages } from "@/lib/packages";
import AssessmentForm from "./AssessmentForm";

type Props = { searchParams: Promise<{ package?: string }> };

export default async function AssessmentPage({ searchParams }: Props) {
  const params = await searchParams;
  const packages = await getPublishedPackages();
  const prefillPackageSlug = params.package ?? "";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded"
          >
            ← Back to home
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Free medical evaluation</h1>
          <p className="mt-1 text-sm text-zinc-400">Share your details and we&apos;ll get in touch within 24 hours. No commitment.</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="mb-8 text-sm text-zinc-500">
          Coordination only — we don&apos;t collect sensitive medical data here.
        </p>
        <AssessmentForm
          packages={packages}
          prefillPackageSlug={prefillPackageSlug}
        />
      </main>
    </div>
  );
}
