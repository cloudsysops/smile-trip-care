import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";

type OutboundRow = {
  lead_id: string;
  status: string;
  channel: string;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  replied_at: string | null;
};

type LeadRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  last_contacted_at: string | null;
};

const ACTIVE_STATUSES = ["new", "contacted", "qualified"];
const TOUCH_STATUSES = new Set(["sent", "delivered", "replied"]);

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  const supabase = getServerSupabase();
  const { data: outboundRowsRaw, error: outboundError } = await supabase
    .from("outbound_messages")
    .select("lead_id, status, channel, created_at, sent_at, delivered_at, replied_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (outboundError) {
    log.error("Failed to load outbound metrics rows", { error: outboundError.message });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  const { data: leadsRaw, error: leadsError } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, status, created_at, last_contacted_at")
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(500);
  if (leadsError) {
    log.error("Failed to load leads for outbound metrics", { error: leadsError.message });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  const outboundRows = (outboundRowsRaw ?? []) as OutboundRow[];
  const leads = (leadsRaw ?? []) as LeadRow[];
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const slaHours = 6;
  const recentTouchWindowMs = 72 * 60 * 60 * 1000;

  const statusTotals: Record<string, number> = {};
  const status24h: Record<string, number> = {};
  const channelTotals: Record<string, number> = {};
  let actionableCount = 0;

  for (const row of outboundRows) {
    statusTotals[row.status] = (statusTotals[row.status] ?? 0) + 1;
    channelTotals[row.channel] = (channelTotals[row.channel] ?? 0) + 1;
    if (row.status === "approved" || row.status === "queued" || row.status === "failed") {
      actionableCount += 1;
    }
    const createdTs = parseTimestamp(row.created_at);
    if (createdTs !== null && createdTs >= last24h) {
      status24h[row.status] = (status24h[row.status] ?? 0) + 1;
    }
  }

  const touchedLeadIds = new Set<string>();
  for (const row of outboundRows) {
    if (!TOUCH_STATUSES.has(row.status)) continue;
    const touchTs =
      parseTimestamp(row.replied_at)
      ?? parseTimestamp(row.delivered_at)
      ?? parseTimestamp(row.sent_at)
      ?? parseTimestamp(row.created_at);
    if (touchTs !== null && touchTs >= now - recentTouchWindowMs) {
      touchedLeadIds.add(row.lead_id);
    }
  }

  const slaRisks = leads
    .map((lead) => {
      const referenceTs = parseTimestamp(lead.last_contacted_at) ?? parseTimestamp(lead.created_at);
      if (referenceTs === null) return null;
      const hoursWithoutContact = (now - referenceTs) / (60 * 60 * 1000);
      if (hoursWithoutContact < slaHours) return null;
      if (touchedLeadIds.has(lead.id)) return null;
      return {
        lead_id: lead.id,
        name: `${lead.first_name} ${lead.last_name}`.trim(),
        email: lead.email,
        status: lead.status,
        hours_without_contact: Math.round(hoursWithoutContact * 10) / 10,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.hours_without_contact - a.hours_without_contact)
    .slice(0, 20);

  return NextResponse.json({
    metrics: {
      total_outbound_messages: outboundRows.length,
      actionable_queue_count: actionableCount,
      status_totals: statusTotals,
      status_last_24h: status24h,
      channel_totals: channelTotals,
      sla_risk_count: slaRisks.length,
      sla_risk_threshold_hours: slaHours,
    },
    sla_risks: slaRisks,
    request_id: requestId,
  });
}
