import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

describe("admin providers API", () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
  });

  it("returns 403 when not admin", async () => {
    requireAdminMock.mockRejectedValueOnce(new Error("Forbidden"));
    const { GET } = await import("@/app/api/admin/providers/route");
    const response = await GET(new Request("http://localhost/api/admin/providers"));
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toHaveProperty("error", "Forbidden");
    expect(data).toHaveProperty("request_id");
  });
});
