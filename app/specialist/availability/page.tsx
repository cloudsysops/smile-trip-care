import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSpecialist } from "@/lib/auth";
import { getAvailabilitySlotsForSpecialist } from "@/lib/services/specialist-availability.service";
import { SpecialistAvailabilityClient } from "./SpecialistAvailabilityClient";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";

export default async function SpecialistAvailabilityPage() {
  let profile;
  try {
    const ctx = await requireSpecialist();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/specialist/availability");
  }
  const specialistId = profile.specialist_id;
  if (!specialistId) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50">
        <AuthDashboardHeader
          title="My availability"
          navItems={[
            { href: "/specialist", label: "Overview" },
            { href: "/specialist/availability", label: "Availability", active: true },
            { href: "/specialist/progress", label: "Progress" },
          ]}
          homeHref="/"
          homeLabel="Home"
          maxWidth="max-w-3xl"
        />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-zinc-300">Your account is not linked to a specialist. Contact an admin.</p>
        </main>
      </div>
    );
  }

  const slots = await getAvailabilitySlotsForSpecialist(specialistId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="My availability"
        navItems={[
          { href: "/specialist", label: "Overview" },
          { href: "/specialist/availability", label: "Availability", active: true },
          { href: "/specialist/progress", label: "Progress" },
        ]}
        homeHref="/"
        homeLabel="Home"
        maxWidth="max-w-3xl"
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="mb-6 text-sm text-zinc-400">
          <Link href="/specialist" className="text-emerald-400 hover:underline">
            ← Back to dashboard
          </Link>
        </p>
        <h1 className="text-2xl font-semibold text-zinc-100">Weekly schedule</h1>
        <p className="mt-1 text-sm text-zinc-400">Mon–Sun · toggle days and set hours</p>
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
          <SpecialistAvailabilityClient initialSlots={slots} />
        </div>
      </main>
    </div>
  );
}
