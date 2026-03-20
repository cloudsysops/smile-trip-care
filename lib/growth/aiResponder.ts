/**
 * Growth helper: generate a suggested reply inviting a user
 * to take the Smile assessment for a free evaluation.
 *
 * This is intentionally simple and synchronous – no external calls.
 */
export function generateSuggestedReply(postText: string, keywordHint?: string): string {
  const siteOrigin =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL.trim()
      ? process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "")
      : "http://localhost:3000";

  const assessmentUrl = `${siteOrigin}/assessment`;

  const trimmed = postText.trim();
  const summaryHint =
    trimmed.length > 0
      ? " I read your message and understand you're exploring options for dental treatment."
      : "";

  const lower = `${trimmed} ${keywordHint ?? ""}`.toLowerCase();
  const mentionsImplant = lower.includes("implant");
  const mentionsVeneer = lower.includes("veneer");
  const mentionsDentures = lower.includes("denture");

  let treatmentLine =
    "High-quality dental treatment (including implants and smile makeovers) can often be done safely in Colombia at a fraction of US or European prices, with modern clinics and experienced specialists.";
  if (mentionsImplant && !mentionsVeneer && !mentionsDentures) {
    treatmentLine =
      "High-quality dental implants can often be done safely in Colombia at a fraction of US or European prices, with modern clinics and experienced specialists.";
  } else if (mentionsVeneer && !mentionsImplant && !mentionsDentures) {
    treatmentLine =
      "High-quality veneer and smile design treatments can often be done safely in Colombia at a fraction of US or European prices, with modern clinics and experienced specialists.";
  } else if (mentionsDentures && !mentionsImplant && !mentionsVeneer) {
    treatmentLine =
      "High-quality dentures and restorative treatments can often be done safely in Colombia at a fraction of US or European prices, with modern clinics and experienced specialists.";
  }

  return [
    "Hi there,",
    "",
    `Thanks for sharing your situation.${summaryHint}`,
    treatmentLine,
    "",
    "If you're considering options, you can start with a free smile assessment with our team. We'll review your case, suggest a treatment plan, and give you an idea of costs and timeline—no commitment.",
    "",
    "You can take the free assessment here:",
    assessmentUrl,
    "",
    "Once you submit it, a coordinator will follow up within about one business day to answer questions and discuss next steps.",
  ].join("\n");
}

