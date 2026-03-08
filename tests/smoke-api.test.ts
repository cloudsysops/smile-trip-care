import { describe, expect, it } from "vitest";
import { GET as getHealth } from "@/app/api/health/route";
import { POST as postLeads } from "@/app/api/leads/route";

describe("API smoke tests", () => {
  it("GET /api/health returns operational payload", async () => {
    const response = await getHealth();
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toMatchObject({
      ok: true,
      status: "ok",
      service: "nebula-smile",
      request_id: expect.any(String),
    });
  });

  it("POST /api/leads rejects invalid input safely", async () => {
    const response = await postLeads(new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ request_id: expect.any(String) });
    expect(body.error).toMatch(/invalid|validation/i);
  });
});
