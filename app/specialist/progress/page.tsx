import { redirect } from "next/navigation";
import Link from "next/link";
import { requireSpecialist } from "@/lib/auth";
import SpecialistProgressClient from "./SpecialistProgressClient";

type Props = { searchParams: Promise<{ lead_id?: string }> };

export default async function SpecialistProgressPage({ searchParams }: Props) {
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/specialist/progress");
  }
  const specialistId = profile.specialist_id;
  if (!specialistId) {
    redirect("/specialist");
  }

  const params = await searchParams;
  const leadId = params.lead_id?.trim();

  if (!leadId) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <Link href="/specialist" className="text-sm font-medium text-zinc-900 underline">
              Specialist
            </Link>
            <h1 className="text-xl font-semibold">Update progress</h1>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-zinc-600">
            Select a case from the{" "}
            <Link href="/specialist" className="text-emerald-600 hover:underline">
              specialist dashboard
            </Link>{" "}
            and click &quot;Update progress&quot; to open this page.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <nav className="flex items-center gap-3">
            <Link href="/specialist" className="text-sm font-medium text-zinc-900 underline">
              Overview
            </Link>
            <Link href="/specialist/progress" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              Progress
            </Link>
          </nav>
          <h1 className="text-xl font-semibold">Update progress</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <SpecialistProgressClient leadId={leadId} />
      </main>
    </div>
  );
}
