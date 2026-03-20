import type { MetadataRoute } from "next";
import { getPublishedPackages } from "@/lib/packages";
import { getPublishedSpecialists } from "@/lib/specialists";
import { absoluteUrl } from "@/lib/seo";

const STATIC_PUBLIC_ROUTES = [
  "/",
  "/assessment",
  "/packages",
  "/health-packages",
  "/tour-experiences",
  "/login",
  "/signup",
  "/signin",
  "/thank-you",
  "/dental-implants-colombia",
  "/hollywood-smile-colombia",
  "/veneers-colombia",
  "/our-clinical-network",
  "/trust-and-safety",
  "/how-payments-work",
  "/legal",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, specialists] = await Promise.all([getPublishedPackages(), getPublishedSpecialists()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
  }));

  const packageEntries: MetadataRoute.Sitemap = packages.map((pkg) => ({
    url: absoluteUrl(`/packages/${pkg.slug}`),
    lastModified: new Date(),
  }));

  const specialistEntries: MetadataRoute.Sitemap = specialists
    .filter((specialist) => Boolean(specialist.slug))
    .map((specialist) => ({
      url: absoluteUrl(`/specialists/${specialist.slug as string}`),
      lastModified: new Date(),
    }));

  return [...staticEntries, ...packageEntries, ...specialistEntries];
}

