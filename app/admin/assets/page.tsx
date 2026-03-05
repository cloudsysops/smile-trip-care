import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AssetsPageClient from "./AssetsPage";

export default async function AdminAssetsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login?next=/admin/assets");
  }

  return <AssetsPageClient />;
}
