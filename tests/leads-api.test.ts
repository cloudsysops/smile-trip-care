import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/leads/route";

const mockLeadId = "550e8400-e29b-41d4-a716-446655440000";

const mockFrom = vi.fn(() => ({
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() =>
        Promise.resolve({ data: { id: mockLeadId }, error: null }))
    }))
  }))
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: vi.fn(() => ({ from: mockFrom })),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => true),
}));

describe("POST /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 and lead_id (UUID) on success", async () => {
    const body = {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
    };
    const request = new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("lead_id", mockLeadId);
    expect(data.lead_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
  it("returns 400 for invalid payload without leaking internals", async () => {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({
      error: "Validation failed. Check your name, email, and other fields.",
      request_id: expect.any(String),
    });
  });

  it("returns safe 500 response for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{\"badJson\":",
    }));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({
      error: "Invalid request body",
      request_id: expect.any(String),
    });
  });

  it("returns 200 and does not process honeypot submissions", async () => {
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
    const payload = await response.json();
    expect(payload).toEqual({
      ok: true,
      request_id: expect.any(String),
    });
  });

  it("returns 400 when referrer_url is not a valid URL", async () => {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        first_name: "Ana",
        last_name: "Buyer",
        email: "ana@example.com",
        referrer_url: "not-a-url",
      }),
    }));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({
      error: "Invalid input",
      request_id: expect.any(String),
    });
  });
});
