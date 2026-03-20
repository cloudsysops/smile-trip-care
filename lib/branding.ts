/**
 * Central branding configuration for the platform.
 * Use these values for product name, company, and tagline across the app and docs.
 */
export const branding = {
  productName: "SmileTripCare",
  companyName: "SmileTripCare",
  tagline: "Trusted medical travel, curated with care.",
  supportCopy:
    "Travel. Heal. Smile. SmileTripCare coordinates dental treatment and recovery in Colombia with vetted specialists and warm, family-curated hospitality.",
} as const;

export type Branding = typeof branding;
