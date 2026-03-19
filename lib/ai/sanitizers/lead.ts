/**
 * Claude/LLM input sanitization for leads.
 *
 * Critical: defensive allowlist strategy.
 * - If there is any doubt about whether a field is safe or complete, we omit it.
 * - We never forward PII (email/phone/full names) nor medical record details nor payments.
 */

export type Lead = Readonly<Record<string, unknown>> & {
  id: string;
  status?: string | null;
  source?: string | null;
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
  country?: string | null;
  city?: string | null;
  package_slug?: string | null;
  selected_specialties?: string[] | null;
  budget_range?: string | null;
  message?: string | null;

  // PII that we explicitly ignore (may exist in the input)
  email?: string | null;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type TreatmentCategory = Readonly<
  | "implants"
  | "veneers"
  | "hollywood_smile"
  | "aesthetic"
  | "general"
>;

export type SanitizedLead = Readonly<{
  id: string;
  status: string;
  source: string;
  createdAt: string;
  country?: string;
  city?: "Medellín" | "Manizales";
  treatmentCategory?: TreatmentCategory;
  /**
   * Approximate budget range. We only include the field when we can tell it's a range
   * (not a single exact number).
   */
  budgetRange?: string;
}>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeCreatedAt(input: Lead["created_at"] | Lead["createdAt"]): string {
  if (!input) {
    throw new Error("sanitizeLead: createdAt is missing");
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) throw new Error("sanitizeLead: createdAt is not parseable");
    return d.toISOString();
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  throw new Error("sanitizeLead: createdAt has invalid type");
}

function deriveCity(lead: Lead): SanitizedLead["city"] | undefined {
  const pkg = (lead.package_slug ?? "").toString().trim();
  if (!pkg) return undefined;
  if (pkg === "smile-medellin") return "Medellín";
  if (pkg === "smile-manizales") return "Manizales";

  const cityRaw = lead.city;
  if (!isNonEmptyString(cityRaw)) return undefined;
  const cityTrim = cityRaw.trim();
  if (cityTrim === "Medellín") return "Medellín";
  if (cityTrim === "Manizales") return "Manizales";
  return undefined;
}

function deriveTreatmentCategory(lead: Lead): TreatmentCategory | undefined {
  const specialties = lead.selected_specialties;
  const keywordsSource: string[] = [];

  if (Array.isArray(specialties)) {
    for (const s of specialties) {
      if (isNonEmptyString(s)) keywordsSource.push(s.toLowerCase());
    }
  }

  // Keyword-only classification. We do NOT forward message content.
  if (isNonEmptyString(lead.message)) {
    keywordsSource.push(lead.message.toLowerCase());
  }

  const joined = keywordsSource.join(" ");
  if (!joined) return undefined;

  if (/\b(hollywood)\b/.test(joined) || joined.includes("hollywood smile")) return "hollywood_smile";
  if (/\b(implant|implants)\b/.test(joined)) return "implants";
  if (joined.includes("veneer") || joined.includes("veneers")) return "veneers";
  if (joined.includes("aesthetic") || joined.includes("cosmetic")) return "aesthetic";

  // If we can’t confidently map, we do not include a treatment category.
  return undefined;
}

function normalizeBudgetRange(lead: Lead): string | undefined {
  const raw = lead.budget_range;
  if (!isNonEmptyString(raw)) return undefined;
  const trimmed = raw.trim();

  // Defensive: only include when it clearly looks like a range.
  // Examples accepted:
  // - "5000-10000"
  // - "$5,000 to $10,000"
  // Examples rejected:
  // - "5000"
  // - "$5000"
  const looksLikeRange =
    /(?:[$€£]\s*)?(\d[\d,.]*)\s*-\s*(?:[$€£]\s*)?(\d[\d,.]*)/.test(trimmed) ||
    /\bto\b/i.test(trimmed) ||
    /\bbetween\b/i.test(trimmed);

  if (!looksLikeRange) return undefined;
  if (trimmed.length > 100) return undefined;

  // Avoid leaking overly specific structures; keep as-is if it’s already a range string.
  return trimmed;
}

/**
 * sanitizeLead:
 * - allowlist only (only output safe fields)
 * - strip PII and sensitive info by omission
 */
export function sanitizeLead(lead: Lead): SanitizedLead {
  const id = typeof lead.id === "string" && lead.id.trim() ? lead.id.trim() : "";
  if (!id) {
    throw new Error("sanitizeLead: lead.id is required");
  }

  const status = isNonEmptyString(lead.status) ? lead.status.trim() : "";
  const source = isNonEmptyString(lead.source) ? lead.source.trim() : "";
  if (!status || !source) {
    throw new Error("sanitizeLead: lead.status and lead.source are required");
  }

  const createdAt = normalizeCreatedAt(lead.created_at ?? lead.createdAt);

  const country = isNonEmptyString(lead.country) ? lead.country.trim() : undefined;
  const city = deriveCity(lead);
  const treatmentCategory = deriveTreatmentCategory(lead);
  const budgetRange = normalizeBudgetRange(lead);

  // Final allowlist output: do NOT include anything else.
  const result: SanitizedLead = {
    id,
    status,
    source,
    createdAt,
  };

  if (country) result.country = country;
  if (city) result.city = city;
  if (treatmentCategory) result.treatmentCategory = treatmentCategory;
  if (budgetRange) result.budgetRange = budgetRange;

  return result;
}

