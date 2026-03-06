import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import StatusDashboard from "./StatusDashboard";
import AdminShell from "../_components/AdminShell";

export default async function AdminStatusPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/status");
  }

  return (
    <AdminShell
      title="Admin — System status"
      currentSection="status"
      headerContainerClassName="max-w-4xl"
      mainContainerClassName="max-w-4xl"
    >
      <StatusDashboard />
    </AdminShell>
  );
}
