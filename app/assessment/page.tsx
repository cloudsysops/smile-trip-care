import type { Metadata } from "next";
import { branding } from "@/lib/branding";
import { getPublishedPackages } from "@/lib/packages";
import { absoluteUrl } from "@/lib/seo";
import AssessmentWizard from "./AssessmentWizard";

type Props = { searchParams: Promise<{ package?: string }> };

export const metadata: Metadata = {
  title: `Free Smile Assessment | ${branding.productName}`,
  description: "Complete a short assessment to get your personalized treatment and travel recommendation.",
  alternates: {
    canonical: absoluteUrl("/assessment"),
  },
};

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
