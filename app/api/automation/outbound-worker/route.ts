import { NextResponse } from "next/server";
import { getServerConfigSafe } from "@/lib/config/server";
import { createLogger } from "@/lib/logger";
import {
  claimDueOutboundMessages,
  markOutboundMessageFailed,
  markOutboundMessageSent,
  outboundRetryBackoffMs,
} from "@/lib/outbound/dispatcher";
import { sendOutboundMessage } from "@/lib/outbound/providers";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

function readProvidedSecret(request: Request): string | null {
  const direct = request.headers.get("x-automation-secret");
  if (direct && direct.length > 0) return direct;

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) return token;
  return null;
}

function getLimitFromRequest(request: Request): number {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("limit") ?? "20");
  if (!Number.isFinite(raw) || raw <= 0) return 20;
  return Math.min(Math.floor(raw), 100);
}

function normalizeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type LeadOutboundContact = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
};

async function fetchLeadContact(leadId: string): Promise<LeadOutboundContact | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("id, email, phone, first_name, last_name")
    .eq("id", leadId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data as LeadOutboundContact;
}

async function markLeadContacted(leadId: string): Promise<void> {
  const supabase = getServerSupabase();
  const nowIso = new Date().toISOString();
  await supabase
    .from("leads")
    .update({
      last_contacted_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", leadId);
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfigSafe();
  if (!config.success) {
    log.error("Outbound worker endpoint config invalid", {
      config_error: config.error.flatten(),
    });
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 500 });
  }

  const secret = config.data.AUTOMATION_CRON_SECRET ?? config.data.CRON_SECRET;
  if (!secret) {
    log.warn("Outbound worker endpoint disabled: secret missing");
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 503 });
  }
  const provided = readProvidedSecret(request);
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
  }

  const limit = getLimitFromRequest(request);
  try {
    const claimed = await claimDueOutboundMessages(limit);
    const result = {
      claimed: claimed.length,
      sent: 0,
      retried: 0,
      failed_permanent: 0,
    };

    for (const message of claimed) {
      log.info("Outbound send started", {
        outbound_id: message.id,
        lead_id: message.lead_id,
        channel: message.channel,
        attempts: message.attempts,
        max_attempts: message.max_attempts,
      });

      try {
        const leadContact = await fetchLeadContact(message.lead_id);
        if (!leadContact) {
          throw new Error("Lead contact not found");
        }

        const sendResult = await sendOutboundMessage({
          channel: message.channel,
          leadId: message.lead_id,
          toEmail: leadContact.email,
          toPhone: leadContact.phone,
          subject: message.subject,
          bodyText: message.body_text,
        });

        await markOutboundMessageSent(message.id, sendResult.provider, sendResult.providerMessageId);
        await markLeadContacted(message.lead_id);
        result.sent += 1;

        log.info("Outbound send succeeded", {
          outbound_id: message.id,
          lead_id: message.lead_id,
          channel: message.channel,
          provider: sendResult.provider,
          provider_message_id: sendResult.providerMessageId,
        });
      } catch (error) {
        const errorMessage = normalizeError(error);
        const exhausted = message.attempts >= message.max_attempts;
        const runAfterIso = exhausted
          ? new Date().toISOString()
          : new Date(Date.now() + outboundRetryBackoffMs(message.attempts)).toISOString();
        await markOutboundMessageFailed(message.id, errorMessage, runAfterIso);
        if (exhausted) {
          result.failed_permanent += 1;
          log.error("Outbound send failed permanently", {
            outbound_id: message.id,
            lead_id: message.lead_id,
            channel: message.channel,
            attempts: message.attempts,
            max_attempts: message.max_attempts,
            error: errorMessage,
          });
        } else {
          result.retried += 1;
          log.warn("Outbound send failed, retry scheduled", {
            outbound_id: message.id,
            lead_id: message.lead_id,
            channel: message.channel,
            attempts: message.attempts,
            max_attempts: message.max_attempts,
            run_after: runAfterIso,
            error: errorMessage,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, ...result, request_id: requestId });
  } catch (error) {
    log.error("Outbound worker execution failed", { error: normalizeError(error) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
