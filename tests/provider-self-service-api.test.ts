import { beforeEach, describe, expect, it, vi } from "vitest";

const requireProviderManagerMock = vi.fn();
const getProviderOverviewMetricsMock = vi.fn();
const fromMock = vi.fn();
const getPackageByIdMock = vi.fn();
const updatePackageMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireProviderManager: requireProviderManagerMock,
}));

vi.mock("@/lib/dashboard-data", () => ({
  getProviderOverviewMetrics: getProviderOverviewMetricsMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({ from: fromMock }),
}));

vi.mock("@/lib/packages", () => ({
  getPackageById: (...args: unknown[]) => getPackageByIdMock(...args),
  updatePackage: (...args: unknown[]) => updatePackageMock(...args),
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const providerProfile = {
  provider_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
};

describe("GET /api/provider/overview", () => {
  beforeEach(() => {
    requireProviderManagerMock.mockReset();
    getProviderOverviewMetricsMock.mockReset();
  });

  it("returns 403 when not provider manager", async () => {
    requireProviderManagerMock.mockRejectedValueOnce(new Error("Forbidden"));
    const { GET } = await import("@/app/api/provider/overview/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 400 when profile has no provider_id", async () => {
    requireProviderManagerMock.mockResolvedValueOnce({ profile: { provider_id: null } });
    const { GET } = await import("@/app/api/provider/overview/route");
    const res = await GET();
    expect(res.status).toBe(400);
  });

  it("returns metrics when linked", async () => {
    requireProviderManagerMock.mockResolvedValueOnce({ profile: providerProfile });
    getProviderOverviewMetricsMock.mockResolvedValueOnce({
      packages_count: 2,
      specialists_count: 3,
      bookings_count: 5,
      revenue_cents: 9900,
    });
    const { GET } = await import("@/app/api/provider/overview/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.packages_count).toBe(2);
    expect(body.specialists_count).toBe(3);
    expect(body.bookings_count).toBe(5);
    expect(body.revenue_cents).toBe(9900);
    expect(body.request_id).toBeDefined();
  });
});

describe("/api/provider/packages", () => {
  const pkgId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    requireProviderManagerMock.mockReset();
    fromMock.mockReset();
    getPackageByIdMock.mockReset();
    updatePackageMock.mockReset();
  });

  it("GET returns 403 when forbidden", async () => {
    requireProviderManagerMock.mockRejectedValueOnce(new Error("Forbidden"));
    const { GET } = await import("@/app/api/provider/packages/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("GET returns packages for provider", async () => {
    requireProviderManagerMock.mockResolvedValueOnce({ profile: providerProfile });
    fromMock.mockImplementation((table: string) => {
      if (table === "packages") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ id: pkgId, slug: "test", name: "Test", published: true, provider_id: providerProfile.provider_id }],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    const { GET } = await import("@/app/api/provider/packages/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.packages).toHaveLength(1);
  });

  it("PATCH returns 404 when package belongs to another provider", async () => {
    requireProviderManagerMock.mockResolvedValueOnce({ profile: providerProfile });
    getPackageByIdMock.mockResolvedValueOnce({
      id: pkgId,
      provider_id: "00000000-0000-0000-0000-000000000001",
      name: "X",
    });
    const { PATCH } = await import("@/app/api/provider/packages/route");
    const res = await PATCH(
      new Request("http://localhost/api/provider/packages", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: pkgId, published: false }),
      }),
    );
    expect(res.status).toBe(404);
    expect(updatePackageMock).not.toHaveBeenCalled();
  });

  it("PATCH updates when package is owned", async () => {
    requireProviderManagerMock.mockResolvedValueOnce({ profile: providerProfile });
    getPackageByIdMock.mockResolvedValueOnce({
      id: pkgId,
      provider_id: providerProfile.provider_id,
      name: "Mine",
    });
    updatePackageMock.mockResolvedValueOnce({
      data: { id: pkgId, name: "Mine", published: false },
      error: null,
    });
    const { PATCH } = await import("@/app/api/provider/packages/route");
    const res = await PATCH(
      new Request("http://localhost/api/provider/packages", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: pkgId, published: false }),
      }),
    );
    expect(res.status).toBe(200);
    expect(updatePackageMock).toHaveBeenCalled();
  });
});
