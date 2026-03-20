import { WHATSAPP_BASE_URL } from "@/lib/config/urls";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  return `${WHATSAPP_BASE_URL}/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}
