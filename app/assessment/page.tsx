import { getPublishedPackages } from "@/lib/packages";
import AssessmentWizard from "./AssessmentWizard";

type Props = { searchParams: Promise<{ package?: string }> };

export default async function AssessmentPage({ searchParams }: Props) {
  const params = await searchParams;
  const packages = await getPublishedPackages();
  const prefillPackageSlug = params.package ?? "";

  return (
    <AssessmentWizard
      packages={packages}
      prefillPackageSlug={prefillPackageSlug}
    />
  );
}
