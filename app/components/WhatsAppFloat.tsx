"use client";

import { usePathname } from "next/navigation";
import { WhatsAppButton } from "./WhatsAppButton";

const PACKAGES_PREFIX = "/packages/";

export default function WhatsAppFloat() {
  const pathname = usePathname() ?? "";
  const show =
    pathname === "/" ||
    pathname === "/assessment" ||
    pathname === "/assessment/proposal" ||
    pathname === "/thank-you" ||
    (pathname.startsWith(PACKAGES_PREFIX) && pathname.length > PACKAGES_PREFIX.length);

  if (!show) return null;
  return <WhatsAppButton variant="float" />;
}
