/** Avoid "Dr. Dr. Pérez" when DB name already includes an honorific. */
export function specialistHonorificName(raw: string | null | undefined): string {
  const s = raw?.trim();
  if (!s) return "Specialist";
  if (/^(dr\.?|dra\.?)\s+/i.test(s)) return s;
  return `Dr. ${s}`;
}
