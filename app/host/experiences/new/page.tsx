import Link from "next/link";
import { redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import HostExperienceForm from "../../HostExperienceForm";

export default async function HostNewExperiencePage() {
  let profile;
  try {
    const ctx = await requireHost();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/host/experiences/new");
  }
  const host = await getHostByProfileId(profile.id);
  if (!host) {
    redirect("/host");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="New experience"
        homeHref="/host/experiences"
        homeLabel="Experiences"
        maxWidth="max-w-3xl"
        navItems={[]}
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-zinc-400">
          <Link href="/host/experiences" className="text-emerald-400 hover:underline">
            ← Back to list
          </Link>
        </p>
        <h1 className="mt-4 text-xl font-semibold text-white">Add experience</h1>
        <p className="mt-1 text-sm text-zinc-400">Lodging, tours, meals, or transport you provide for dental tourism guests.</p>
        <div className="mt-8">
          <HostExperienceForm mode="create" />
        </div>
      </main>
    </div>
  );
}
