import type { Metadata } from "next";
import { branding } from "@/lib/branding";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Sign Up | ${branding.productName}`,
  description: "Create your patient account to track your recommendation and deposit flow.",
  alternates: {
    canonical: absoluteUrl("/signup"),
  },
};

export default function SignupLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

