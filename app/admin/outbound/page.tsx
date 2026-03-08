import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AdminShell from "../_components/AdminShell";
import OutboundCommandCenter from "./OutboundCommandCenter";

export default async function AdminOutboundPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/outbound");
  }

  return (
    <AdminShell
      title="Admin — Outbound command center"
      currentSection="outbound"
      headerContainerClassName="max-w-5xl"
      mainContainerClassName="max-w-5xl"
    >
      <OutboundCommandCenter />
    </AdminShell>
  );
}
