import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentProfileMock = vi.fn();
const requireSpecialistMock = vi.fn();
const getHostByProfileIdMock = vi.fn();
const createHostOnboardingLinkMock = vi.fn();
const createSpecialistOnboardingLinkMock = vi.fn();

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    getCurrentProfile: getCurrentProfileMock,
    requireSpecialist: requireSpecialistMock,
  };
});

vi.mock("@/lib/services/hosts.service", () => ({
  getHostByProfileId: getHostByProfileIdMock,
}));

vi.mock("@/lib/services/stripe-connect.service", () => ({
  createHostOnboardingLink: createHostOnboardingLinkMock,
  createSpecialistOnboardingLink: createSpecialistOnboardingLinkMock,
}));

describe("POST /api/stripe/connect/host/onboarding", () => {
  beforeEach(() => {
    getCurrentProfileMock.mockReset();
    getHostByProfileIdMock.mockReset();
    createHostOnboardingLinkMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    getCurrentProfileMock.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/stripe/connect/host/onboarding/route");
    const res = await POST(new Request("http://localhost/api/stripe/connect/host/onboarding", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user has no host profile", async () => {
    getCurrentProfileMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1" },
    });
    getHostByProfileIdMock.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/stripe/connect/host/onboarding/route");
    const res = await POST(new Request("http://localhost/api/stripe/connect/host/onboarding", { method: "POST" }));
    expect(res.status).toBe(403);
  });

  it("returns onboarding URL on success", async () => {
    getCurrentProfileMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1" },
    });
    getHostByProfileIdMock.mockResolvedValueOnce({ id: "host-1" });
    createHostOnboardingLinkMock.mockResolvedValueOnce("https://connect.stripe.test/onboarding");

    const { POST } = await import("@/app/api/stripe/connect/host/onboarding/route");
    const res = await POST(new Request("http://localhost/api/stripe/connect/host/onboarding", { method: "POST" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, url: "https://connect.stripe.test/onboarding" });
  });
});

describe("POST /api/stripe/connect/specialist/onboarding", () => {
  beforeEach(() => {
    requireSpecialistMock.mockReset();
    createSpecialistOnboardingLinkMock.mockReset();
  });

  it("returns 401 when specialist guard fails", async () => {
    requireSpecialistMock.mockRejectedValueOnce(new Error("Unauthorized"));
    const { POST } = await import("@/app/api/stripe/connect/specialist/onboarding/route");
    const res = await POST(new Request("http://localhost/api/stripe/connect/specialist/onboarding", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when profile has no specialist_id", async () => {
    requireSpecialistMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1", specialist_id: null },
    });
    const { POST } = await import("@/app/api/stripe/connect/specialist/onboarding/route");
    const res = await POST(new Request("http://localhost/api/stripe/connect/specialist/onboarding", { method: "POST" }));
    expect(res.status).toBe(403);
  });

  it("returns onboarding URL for specialist", async () => {
    requireSpecialistMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1", specialist_id: "spec-1" },
    });
    createSpecialistOnboardingLinkMock.mockResolvedValueOnce("https://connect.stripe.test/spec-onboarding");

    const { POST } = await import("@/app/api/stripe/connect/specialist/onboarding/route");
    const res = await POST(new Request("http://localhost/api/stripe/connect/specialist/onboarding", { method: "POST" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, url: "https://connect.stripe.test/spec-onboarding" });
  });
});

