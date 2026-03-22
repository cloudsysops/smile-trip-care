import Link from "next/link";
import { redirect } from "next/navigation";
import { requireHost } from "@/lib/auth";
import { getHostByProfileId } from "@/lib/services/hosts.service";
import HostNewServiceForm from "./HostNewServiceForm";

export default async function HostNewServicePage() {
  let profile;
  try {
    const ctx = await requireHost();
    profile = ctx.profile;
  } catch {
    redirect("/login?next=/host/services/new");
  }

  const host = await getHostByProfileId(profile.id);
  if (!host) {
    redirect("/host");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto max-w-lg px-4 py-10">
        <Link href="/host/services" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to services
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">New service</h1>
        <p className="mt-1 text-sm text-zinc-400">List an add-on for dental travelers (lodging, transport, etc.).</p>
        <HostNewServiceForm />
      </main>
    </div>
  );
}
