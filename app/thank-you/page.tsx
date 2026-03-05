import Link from "next/link";

type Props = { searchParams: Promise<{ lead_id?: string }> };

export default async function ThankYouPage({ searchParams }: Props) {
  const { lead_id } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            ← Smile Transformation
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Thank you</h1>
        <p className="mt-4 text-zinc-600">
          We&apos;ve received your information and will be in touch soon.
        </p>
        {lead_id && (
          <p className="mt-2 text-sm text-zinc-500">Reference: {lead_id}</p>
        )}
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-emerald-600 px-8 py-3 font-medium text-white hover:bg-emerald-700"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
