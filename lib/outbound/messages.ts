export const OUTBOUND_CHANNELS = ["whatsapp", "email"] as const;
export type OutboundChannel = (typeof OUTBOUND_CHANNELS)[number];

export const OUTBOUND_SOURCES = ["ai_draft", "manual"] as const;
export type OutboundSource = (typeof OUTBOUND_SOURCES)[number];

export const OUTBOUND_STATUSES = [
  "draft",
  "approved",
  "queued",
  "sent",
  "delivered",
  "failed",
  "replied",
  "cancelled",
] as const;
export type OutboundStatus = (typeof OUTBOUND_STATUSES)[number];

const transitionMap: Record<OutboundStatus, OutboundStatus[]> = {
  draft: ["approved", "cancelled"],
  approved: ["queued", "sent", "cancelled"],
  queued: ["sent", "failed", "cancelled"],
  sent: ["delivered", "failed", "replied", "cancelled"],
  delivered: ["replied", "cancelled"],
  failed: ["queued", "cancelled"],
  replied: [],
  cancelled: [],
};

export function canTransitionOutboundStatus(from: OutboundStatus, to: OutboundStatus): boolean {
  if (from === to) return true;
  return transitionMap[from].includes(to);
}
