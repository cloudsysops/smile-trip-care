import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns service health payload", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.status).toBe("ok");
    expect(typeof payload.version).toBe("string");
    expect(typeof payload.time).toBe("string");
    expect(typeof payload.request_id).toBe("string");
    expect(Number.isNaN(Date.parse(payload.time))).toBe(false);
  });
});
