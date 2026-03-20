import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProviderManager } from "@/lib/auth";
import { getPackageById } from "@/lib/packages";
import AuthDashboardHeader from "@/app/components/dashboard/AuthDashboardHeader";
import ProviderPackageEditForm from "./ProviderPackageEditForm";

const NAV = [
  { href: "/provider", label: "Overview" },
  { href: "/provider/packages", label: "Packages", active: true as const },
  { href: "/provider/specialists", label: "Specialists" },
];

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function ProviderPackageEditPage({ params }: Props) {
  let profile;
  try {
    const ctx = await requireProviderManager();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/provider/packages");
  }
  const providerId = profile.provider_id?.trim() ?? "";
  if (!providerId) {
    redirect("/provider/packages");
  }
  const { id } = await params;
  const pkg = await getPackageById(id);
  if (!pkg || (pkg.provider_id ?? "") !== providerId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AuthDashboardHeader title={`Edit: ${pkg.name}`} navItems={NAV} homeHref="/" homeLabel="Home" maxWidth="max-w-4xl" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/provider/packages" className="text-sm text-emerald-700 hover:underline">
          ← Back to packages
        </Link>
        <div className="mt-4">
          <ProviderPackageEditForm
            packageId={pkg.id}
            initialName={pkg.name}
            initialDescription={pkg.description}
            initialPublished={pkg.published}
          />
        </div>
      </main>
    </div>
  );
}
