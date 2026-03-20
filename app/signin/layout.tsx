import type { Metadata } from "next";
import { branding } from "@/lib/branding";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Admin Sign In | ${branding.productName}`,
  description: "Access the operations dashboard for lead and journey coordination.",
  alternates: {
    canonical: absoluteUrl("/signin"),
  },
};

export default function SigninLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

