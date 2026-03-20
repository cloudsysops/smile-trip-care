import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
    storage: { from: vi.fn() },
  }),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("admin API input validation", () => {
  beforeEach(() => {
    requireAdminMock.mockResolvedValue({ user: { id: "admin-user" }, profile: { id: "admin-user-id" } });
    fromMock.mockReset();
  });

  it("rejects invalid lead id before touching Supabase", async () => {
    const { PATCH } = await import("@/app/api/admin/leads/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/leads/not-a-uuid", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "new" }),
      }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid lead id" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects invalid boolean filters in assets list query", async () => {
    const { GET } = await import("@/app/api/admin/assets/route");
    const response = await GET(
      new Request("http://localhost/api/admin/assets?approved=not-bool"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid filters" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects empty lead patch body when no update fields are present", async () => {
    const { PATCH } = await import("@/app/api/admin/leads/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/leads/550e8400-e29b-41d4-a716-446655440000", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid body" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects invalid datetime format in follow-up fields", async () => {
    const { PATCH } = await import("@/app/api/admin/leads/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/admin/leads/550e8400-e29b-41d4-a716-446655440000", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ next_follow_up_at: "tomorrow" }),
      }),
      { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid body" });
    expect(fromMock).not.toHaveBeenCalled();
  });
});
