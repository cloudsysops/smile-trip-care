import Link from "next/link";
import { getPublishedPackages } from "@/lib/packages";
import AssessmentForm from "./AssessmentForm";

type Props = { searchParams: Promise<{ package?: string }> };

export default async function AssessmentPage({ searchParams }: Props) {
  const params = await searchParams;
  const packages = await getPublishedPackages();
  const prefillPackageSlug = params.package ?? "";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
            ← Smile Transformation
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Assessment</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Share a few details and we&apos;ll get in touch.</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          This form is for coordination only. We do not collect sensitive medical data here.
        </p>
        <AssessmentForm packages={packages} prefillPackageSlug={prefillPackageSlug} />
      </main>
    </div>
  );
}
