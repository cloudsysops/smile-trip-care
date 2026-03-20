import { describe, expect, it, vi, beforeEach } from "vitest";

const getCurrentProfileMock = vi.fn();
const getProfileRolesMock = vi.fn();
const getServerSupabaseMock = vi.fn();

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    getCurrentProfile: getCurrentProfileMock,
  };
});

vi.mock("@/lib/services/roles.service", () => ({
  getProfileRoles: getProfileRolesMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: getServerSupabaseMock,
}));

describe("POST /api/auth/active-role", () => {
  beforeEach(() => {
    getCurrentProfileMock.mockReset();
    getProfileRolesMock.mockReset();
    getServerSupabaseMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    getCurrentProfileMock.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/auth/active-role/route");
    const res = await POST(new Request("http://localhost/api/auth/active-role", { method: "POST", body: JSON.stringify({ role: "host" }) }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when role is not assigned", async () => {
    getCurrentProfileMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "p1", role: "patient", active_role: null, is_active: true, email: null, full_name: null, provider_id: null, specialist_id: null, created_at: null, updated_at: null },
    });
    getProfileRolesMock.mockResolvedValueOnce([
      { id: "r1", profile_id: "p1", role: "patient", is_active: true, created_at: new Date().toISOString() },
    ]);

    const { POST } = await import("@/app/api/auth/active-role/route");
    const res = await POST(new Request("http://localhost/api/auth/active-role", { method: "POST", body: JSON.stringify({ role: "host" }) }));
    expect(res.status).toBe(403);
  });

  it("updates active_role and returns redirectPath on success", async () => {
    const eqMock = vi.fn().mockResolvedValueOnce({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock });
    getServerSupabaseMock.mockReturnValue({ from: fromMock });

    getCurrentProfileMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "p1", role: "patient", active_role: null, is_active: true, email: null, full_name: null, provider_id: null, specialist_id: null, created_at: null, updated_at: null },
    });
    getProfileRolesMock.mockResolvedValueOnce([
      { id: "r1", profile_id: "p1", role: "host", is_active: true, created_at: new Date().toISOString() },
      { id: "r2", profile_id: "p1", role: "patient", is_active: true, created_at: new Date().toISOString() },
    ]);

    const { POST } = await import("@/app/api/auth/active-role/route");
    const res = await POST(new Request("http://localhost/api/auth/active-role", { method: "POST", body: JSON.stringify({ role: "host" }) }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, active_role: "host", redirectPath: "/host" });

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith({ active_role: "host" });
    expect(eqMock).toHaveBeenCalledWith("id", "p1");
  });
});

