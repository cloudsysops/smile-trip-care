import Link from "next/link";
import { branding } from "@/lib/branding";
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
        <div className="mx-auto max-w-2xl px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 rounded"
          >
            ← {branding.productName}
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-3xl">Free smile evaluation</h1>
          <p className="mt-2 text-zinc-400">
            Share your details and goals. We&apos;ll review your case and get in touch within 24 hours—no commitment.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Coordination only. We don&apos;t collect sensitive medical data here.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <AssessmentForm
          packages={packages}
          prefillPackageSlug={prefillPackageSlug}
        />
      </main>
    </div>
  );
}
