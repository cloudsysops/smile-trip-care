import type { MetadataRoute } from "next";
import { getSiteOriginFromEnv } from "@/lib/config/urls";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteOriginFromEnv();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

