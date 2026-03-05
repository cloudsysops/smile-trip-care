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
      error: "Invalid input",
      request_id: expect.any(String),
    });
  });

  it("returns safe 500 response for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{\"badJson\":",
    }));

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload).toEqual({
      error: "Server error",
      request_id: expect.any(String),
    });
  });
});
