import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import { getHostByProfileId, getHostExperienceById } from "@/lib/services/hosts.service";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import HostExperienceDeleteButton from "../../HostExperienceDeleteButton";
import HostExperienceForm from "../../HostExperienceForm";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function HostEditExperiencePage({ params }: Props) {
  const { id } = await params;
  let profile;
  try {
    const ctx = await requireHost();
    profile = ctx.profile;
  } catch {
    redirect(`/login?next=/host/experiences/${id}`);
  }
  const host = await getHostByProfileId(profile.id);
  if (!host) {
    redirect("/host");
  }
  const experience = await getHostExperienceById(host.id, id);
  if (!experience) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <AuthDashboardHeader
        title="Edit experience"
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
        <h1 className="mt-4 text-xl font-semibold text-white">{experience.name}</h1>
        <div className="mt-8 space-y-6">
          <HostExperienceForm
            mode="edit"
            experienceId={experience.id}
            initial={{
              name: experience.name,
              description: experience.description,
              category: experience.category,
              base_price_cents: experience.base_price_cents,
              city: experience.city,
              published: experience.published,
            }}
          />
          <HostExperienceDeleteButton experienceId={experience.id} />
        </div>
      </main>
    </div>
  );
}
