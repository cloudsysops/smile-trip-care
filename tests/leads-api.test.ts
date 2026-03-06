import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/leads/route";

describe("POST /api/leads", () => {
  it("returns 400 for invalid payload without leaking internals", async () => {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({
      ok: false,
      error: "Invalid input",
      request_id: expect.any(String),
    });
  });

  it("returns safe 400 response for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{\"badJson\":",
    }));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({
      ok: false,
      error: "Invalid input",
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
});
