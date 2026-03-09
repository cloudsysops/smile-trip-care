/**
 * Central branding configuration for the platform.
 * Use these values for product name, company, and tagline across the app and docs.
 */
export const branding = {
  productName: "MedVoyage Smile",
  companyName: "MedVoyage",
  tagline: "Premium Dental Tourism Platform",
  supportCopy:
    "Transform your smile in Colombia with trusted specialists, guided care, and premium travel coordination.",
} as const;

export type Branding = typeof branding;
