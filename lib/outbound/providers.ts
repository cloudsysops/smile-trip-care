import { getServerConfigSafe } from "@/lib/config/server";

type SendEmailInput = {
  toEmail: string;
  subject: string;
  bodyText: string;
};

type SendWhatsAppInput = {
  toPhone: string;
  bodyText: string;
  leadId: string;
};

export type SendOutboundResult = {
  provider: string;
  providerMessageId: string | null;
};

function normalizeTextMessageId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const out = payload as Record<string, unknown>;
  const id = out.id ?? out.message_id ?? out.messageId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

async function sendEmailViaResend(input: SendEmailInput): Promise<SendOutboundResult> {
  const config = getServerConfigSafe();
  if (!config.success) {
    throw new Error("Invalid server configuration for outbound email");
  }
  const apiKey = config.data.RESEND_API_KEY;
  const from = config.data.OUTBOUND_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email provider not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [input.toEmail],
      subject: input.subject,
      text: input.bodyText,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload
      ? String((payload as Record<string, unknown>).message)
      : `Email provider error (${response.status})`;
    throw new Error(message);
  }

  return {
    provider: "resend",
    providerMessageId: normalizeTextMessageId(payload),
  };
}

async function sendWhatsAppViaHttp(input: SendWhatsAppInput): Promise<SendOutboundResult> {
  const config = getServerConfigSafe();
  if (!config.success) {
    throw new Error("Invalid server configuration for outbound WhatsApp");
  }
  const apiUrl = config.data.OUTBOUND_WHATSAPP_API_URL;
  const token = config.data.OUTBOUND_WHATSAPP_API_TOKEN;
  if (!apiUrl || !token) {
    throw new Error("WhatsApp provider not configured");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: input.toPhone,
      message: input.bodyText,
      lead_id: input.leadId,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload
      ? String((payload as Record<string, unknown>).message)
      : `WhatsApp provider error (${response.status})`;
    throw new Error(message);
  }

  return {
    provider: "whatsapp-http",
    providerMessageId: normalizeTextMessageId(payload),
  };
}

export async function sendOutboundMessage(params: {
  channel: "whatsapp" | "email";
  leadId: string;
  toEmail?: string | null;
  toPhone?: string | null;
  subject?: string | null;
  bodyText: string;
}): Promise<SendOutboundResult> {
  if (params.channel === "email") {
    if (!params.toEmail) {
      throw new Error("Missing recipient email");
    }
    const subject = params.subject?.trim();
    if (!subject) {
      throw new Error("Missing email subject");
    }
    return sendEmailViaResend({
      toEmail: params.toEmail,
      subject,
      bodyText: params.bodyText,
    });
  }

  if (!params.toPhone) {
    throw new Error("Missing recipient phone");
  }
  return sendWhatsAppViaHttp({
    toPhone: params.toPhone,
    bodyText: params.bodyText,
    leadId: params.leadId,
  });
}
