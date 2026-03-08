import Link from "next/link";

export const metadata = {
  title: "Legal | Nebula Smile",
  description: "Legal information and privacy.",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-white hover:text-zinc-300">
            Nebula Smile
          </Link>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-white">Legal</h1>
        <p className="mb-4 text-zinc-400">
          Nebula Smile is a USA LLC. We coordinate international health and hospitality only; medical services are provided and billed by clinics in Colombia.
        </p>
        <h2 className="mb-2 mt-8 text-lg font-semibold text-white">Privacy</h2>
        <p className="text-zinc-400">
          We use your contact details only to coordinate your assessment and travel. We do not sell your data. For full privacy policy, contact us via the main site.
        </p>
        <p className="mt-10 text-sm text-zinc-500">
          <Link href="/" className="underline hover:text-zinc-400">Back to home</Link>
        </p>
      </main>
    </div>
  );
}
