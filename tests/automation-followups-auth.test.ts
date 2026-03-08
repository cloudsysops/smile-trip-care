import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/automation/followups/route";

describe("POST /api/automation/followups", () => {
  const originalSecret = process.env.AUTOMATION_CRON_SECRET;

  beforeEach(() => {
    process.env.AUTOMATION_CRON_SECRET = "automation-secret-12345";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.AUTOMATION_CRON_SECRET;
    } else {
      process.env.AUTOMATION_CRON_SECRET = originalSecret;
    }
  });

  it("returns 401 when cron secret is missing", async () => {
    const response = await POST(new Request("http://localhost/api/automation/followups", { method: "POST" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
      request_id: expect.any(String),
    });
  });

  it("returns 503 when endpoint is not configured", async () => {
    delete process.env.AUTOMATION_CRON_SECRET;
    const response = await POST(new Request("http://localhost/api/automation/followups", { method: "POST" }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Not configured",
      request_id: expect.any(String),
    });
  });
});
