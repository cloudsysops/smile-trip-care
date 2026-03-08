/**
 * Central branding configuration for the platform.
 * Use these values for product name, company, and tagline across the app and docs.
 */
export const branding = {
  productName: "Nebula Smile",
  companyName: "Nebula Nexus",
  tagline: "Dental transformation & medical travel in Colombia",
} as const;

export type Branding = typeof branding;
