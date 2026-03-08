import { beforeEach, describe, expect, it, vi } from "vitest";

const claimDueOutboundMessagesMock = vi.fn();
const markOutboundMessageSentMock = vi.fn();
const markOutboundMessageFailedMock = vi.fn();
const outboundRetryBackoffMsMock = vi.fn();
const sendOutboundMessageMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/config/server", () => ({
  getServerConfigSafe: () => ({
    success: true,
    data: {
      AUTOMATION_CRON_SECRET: "automation-secret-12345",
      CRON_SECRET: "automation-secret-12345",
    },
  }),
}));

vi.mock("@/lib/outbound/dispatcher", () => ({
  claimDueOutboundMessages: claimDueOutboundMessagesMock,
  markOutboundMessageSent: markOutboundMessageSentMock,
  markOutboundMessageFailed: markOutboundMessageFailedMock,
  outboundRetryBackoffMs: outboundRetryBackoffMsMock,
}));

vi.mock("@/lib/outbound/providers", () => ({
  sendOutboundMessage: sendOutboundMessageMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
  }),
}));

describe("POST /api/automation/outbound-worker", () => {
  beforeEach(() => {
    claimDueOutboundMessagesMock.mockReset();
    markOutboundMessageSentMock.mockReset();
    markOutboundMessageFailedMock.mockReset();
    outboundRetryBackoffMsMock.mockReset();
    sendOutboundMessageMock.mockReset();
    fromMock.mockReset();
    outboundRetryBackoffMsMock.mockReturnValue(300_000);
    fromMock.mockImplementation((table: string) => {
      if (table === "leads") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "lead-1",
                  email: "lead@example.com",
                  phone: "+15551234567",
                  first_name: "Lead",
                  last_name: "One",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      return {};
    });
  });

  it("marks outbound messages as sent on success", async () => {
    claimDueOutboundMessagesMock.mockResolvedValue([
      {
        id: "msg-1",
        lead_id: "lead-1",
        channel: "whatsapp",
        subject: null,
        body_text: "Hello from Smile",
        attempts: 1,
        max_attempts: 3,
      },
    ]);
    sendOutboundMessageMock.mockResolvedValue({
      provider: "whatsapp-http",
      providerMessageId: "provider-1",
    });

    const { POST } = await import("@/app/api/automation/outbound-worker/route");
    const response = await POST(new Request("http://localhost/api/automation/outbound-worker", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      claimed: 1,
      sent: 1,
      retried: 0,
      failed_permanent: 0,
    });
    expect(markOutboundMessageSentMock).toHaveBeenCalledWith("msg-1", "whatsapp-http", "provider-1");
    expect(markOutboundMessageFailedMock).not.toHaveBeenCalled();
  });

  it("schedules retry when outbound send fails before max attempts", async () => {
    claimDueOutboundMessagesMock.mockResolvedValue([
      {
        id: "msg-2",
        lead_id: "lead-1",
        channel: "email",
        subject: "Hello",
        body_text: "Message body",
        attempts: 1,
        max_attempts: 3,
      },
    ]);
    sendOutboundMessageMock.mockRejectedValue(new Error("provider timeout"));

    const { POST } = await import("@/app/api/automation/outbound-worker/route");
    const response = await POST(new Request("http://localhost/api/automation/outbound-worker", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      claimed: 1,
      sent: 0,
      retried: 1,
      failed_permanent: 0,
    });
    expect(markOutboundMessageFailedMock).toHaveBeenCalledTimes(1);
    expect(markOutboundMessageSentMock).not.toHaveBeenCalled();
  });

  it("marks permanent failure when attempts exhausted", async () => {
    claimDueOutboundMessagesMock.mockResolvedValue([
      {
        id: "msg-3",
        lead_id: "lead-1",
        channel: "whatsapp",
        subject: null,
        body_text: "Message body",
        attempts: 3,
        max_attempts: 3,
      },
    ]);
    sendOutboundMessageMock.mockRejectedValue(new Error("invalid phone"));

    const { POST } = await import("@/app/api/automation/outbound-worker/route");
    const response = await POST(new Request("http://localhost/api/automation/outbound-worker", {
      method: "POST",
      headers: { "x-automation-secret": "automation-secret-12345" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      claimed: 1,
      sent: 0,
      retried: 0,
      failed_permanent: 1,
    });
    expect(markOutboundMessageFailedMock).toHaveBeenCalledTimes(1);
  });
});
