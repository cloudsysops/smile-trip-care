import { getServerSupabase } from "@/lib/supabase/server";

export type OutboundDispatchMessage = {
  id: string;
  lead_id: string;
  channel: "whatsapp" | "email";
  subject: string | null;
  body_text: string;
  status: "approved" | "queued" | "failed" | "draft" | "sent" | "delivered" | "replied" | "cancelled";
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS = [
  "id",
  "lead_id",
  "channel",
  "subject",
  "body_text",
  "status",
  "attempts",
  "max_attempts",
  "scheduled_for",
  "failure_reason",
  "created_at",
  "updated_at",
].join(", ");

function truncateFailureReason(message: string): string {
  return message.length > 800 ? message.slice(0, 800) : message;
}

export function outboundRetryBackoffMs(attempts: number): number {
  const base = 5 * 60_000;
  const factor = Math.max(0, attempts - 1);
  return Math.min(base * (2 ** factor), 2 * 60 * 60_000);
}

export async function claimDueOutboundMessages(limit: number): Promise<OutboundDispatchMessage[]> {
  const supabase = getServerSupabase();
  const nowIso = new Date().toISOString();
  const { data: dueRows, error: dueError } = await supabase
    .from("outbound_messages")
    .select(SELECT_COLUMNS)
    .in("status", ["approved", "queued", "failed"])
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (dueError) {
    throw new Error(`Failed to claim outbound messages: ${dueError.message}`);
  }

  const due = (dueRows ?? []) as unknown as OutboundDispatchMessage[];
  const claimed: OutboundDispatchMessage[] = [];
  for (const row of due) {
    const nextAttempts = Number(row.attempts ?? 0) + 1;
    const { data: claimedRow, error: claimError } = await supabase
      .from("outbound_messages")
      .update({
        status: "queued",
        attempts: nextAttempts,
        failure_reason: null,
        updated_at: nowIso,
      })
      .eq("id", row.id)
      .eq("attempts", row.attempts)
      .in("status", ["approved", "queued", "failed"])
      .select(SELECT_COLUMNS)
      .maybeSingle();
    if (claimError) {
      throw new Error(`Failed to lock outbound message ${row.id}: ${claimError.message}`);
    }
    if (claimedRow) {
      claimed.push(claimedRow as unknown as OutboundDispatchMessage);
    }
  }
  return claimed;
}

export async function markOutboundMessageSent(
  messageId: string,
  provider: string,
  providerMessageId: string | null,
): Promise<void> {
  const supabase = getServerSupabase();
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("outbound_messages")
    .update({
      status: "sent",
      provider,
      provider_message_id: providerMessageId,
      sent_at: nowIso,
      failure_reason: null,
      updated_at: nowIso,
    })
    .eq("id", messageId);
  if (error) {
    throw new Error(`Failed to mark outbound message sent: ${error.message}`);
  }
}

export async function markOutboundMessageFailed(
  messageId: string,
  failureReason: string,
  nextRunAfterIso: string,
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("outbound_messages")
    .update({
      status: "failed",
      failure_reason: truncateFailureReason(failureReason),
      scheduled_for: nextRunAfterIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId);
  if (error) {
    throw new Error(`Failed to mark outbound message failed: ${error.message}`);
  }
}
