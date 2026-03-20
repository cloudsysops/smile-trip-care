import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSupabaseMock } = vi.hoisted(() => ({
  getServerSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: getServerSupabaseMock,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("POST /api/leads honeypot guard", () => {
  beforeEach(() => {
    getServerSupabaseMock.mockReset();
  });

  it("returns 200 and never initializes Supabase when honeypot is filled", async () => {
    const { POST } = await import("@/app/api/leads/route");

    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        first_name: "Bot",
        last_name: "Traffic",
        email: "bot@example.com",
        company_website: "https://spam.example.com",
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      request_id: expect.any(String),
    });
    expect(getServerSupabaseMock).not.toHaveBeenCalled();
  });
});
