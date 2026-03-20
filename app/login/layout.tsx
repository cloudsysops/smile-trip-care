import type { Metadata } from "next";
import { branding } from "@/lib/branding";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Login | ${branding.productName}`,
  description: "Sign in to continue your Smile transformation journey dashboard.",
  alternates: {
    canonical: absoluteUrl("/login"),
  },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

