import { getSiteOriginFromEnv } from "@/lib/config/urls";

export function absoluteUrl(path: string): string {
  const origin = getSiteOriginFromEnv();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

