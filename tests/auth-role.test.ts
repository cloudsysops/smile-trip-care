import { describe, expect, it, vi } from "vitest";
import {
  getRedirectPathForRole,
  roleRedirectRole,
  type ProfileRole,
} from "@/lib/auth";

describe("auth role helpers", () => {
  it("getRedirectPathForRole returns correct paths", () => {
    expect(getRedirectPathForRole("admin" as ProfileRole)).toBe("/admin/overview");
    expect(getRedirectPathForRole("coordinator" as ProfileRole)).toBe("/coordinator");
    expect(getRedirectPathForRole("provider_manager" as ProfileRole)).toBe("/provider");
    expect(getRedirectPathForRole("specialist" as ProfileRole)).toBe("/specialist");
    expect(getRedirectPathForRole("patient" as ProfileRole)).toBe("/patient");
    expect(getRedirectPathForRole("user" as ProfileRole)).toBe("/patient");
    expect(getRedirectPathForRole("host" as ProfileRole)).toBe("/host");
  });

  it("roleRedirectRole maps user to patient", () => {
    expect(roleRedirectRole("user" as ProfileRole)).toBe("patient");
    expect(roleRedirectRole("admin" as ProfileRole)).toBe("admin");
  });
});

const getCurrentProfileMock = vi.hoisted(() => vi.fn());
const getEffectiveRoleForProfileMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    getCurrentProfile: getCurrentProfileMock,
    getEffectiveRoleForProfile: getEffectiveRoleForProfileMock,
  };
});

describe("GET /api/auth/me", () => {
  it("returns 401 when not authenticated", async () => {
    getCurrentProfileMock.mockResolvedValueOnce(null);
    const { GET } = await import("@/app/api/auth/me/route");
    const response = await GET(new Request("http://localhost/api/auth/me"));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty("error", "Unauthorized");
  });

  it("returns role and redirectPath when authenticated", async () => {
    getEffectiveRoleForProfileMock.mockImplementation(async (profile: { role: ProfileRole }) => profile.role);
    getCurrentProfileMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: {
        id: "u1",
        email: "admin@example.com",
        full_name: "Admin",
        role: "admin",
        provider_id: null,
        specialist_id: null,
        is_active: true,
        created_at: null,
        updated_at: null,
      },
    });
    const { GET } = await import("@/app/api/auth/me/route");
    const response = await GET(new Request("http://localhost/api/auth/me"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("role", "admin");
    expect(data).toHaveProperty("redirectPath", "/admin/overview");
  });
});
