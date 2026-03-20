import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSpecialist } from "@/lib/auth";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import SpecialistCaseDetailClient from "./SpecialistCaseDetailClient";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function SpecialistCaseDetailPage({ params }: Props) {
  try {
    await requireSpecialist();
  } catch {
    redirect("/login?next=/specialist");
  }

  const { id } = await params;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="Specialist case detail"
        navItems={[
          { href: "/specialist", label: "Overview" },
          { href: "/specialist/availability", label: "Availability" },
          { href: "/specialist/progress", label: "Progress" },
        ]}
        homeHref="/"
        homeLabel="Home"
        maxWidth="max-w-4xl"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-sm text-zinc-400">
          <Link href="/specialist" className="text-emerald-400 hover:underline">
            ← Back to specialist dashboard
          </Link>
        </p>
        <SpecialistCaseDetailClient caseId={id} />
      </main>
    </div>
  );
}

