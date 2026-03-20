import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();
const selectMock = vi.fn();
const eqMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: () => ({
    from: fromMock,
    select: selectMock,
    eq: eqMock,
    maybeSingle: maybeSingleMock,
  }),
}));

import { getHostByProfileId, getHostById, getHostExperiences } from "@/lib/services/hosts.service";

describe("hosts.service", () => {
  beforeEach(() => {
    fromMock.mockReset();
    selectMock.mockReset();
    eqMock.mockReset();
    maybeSingleMock.mockReset();
    fromMock.mockReturnThis();
    selectMock.mockReturnThis();
    eqMock.mockReturnThis();
  });

  it("getHostByProfileId returns null when no host", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    const host = await getHostByProfileId("profile-1");
    expect(host).toBeNull();
  });

  it("getHostById returns host when found", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "host-1",
        profile_id: "profile-1",
        display_name: "Test Host",
        city: "Medellín",
        bio: null,
        phone: null,
        whatsapp: null,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      error: null,
    });
    const host = await getHostById("host-1");
    expect(host).not.toBeNull();
    expect(host?.id).toBe("host-1");
  });

  it("getHostExperiences returns empty array when no experiences", async () => {
    fromMock.mockReturnThis();
    selectMock.mockReturnThis();
    eqMock.mockResolvedValueOnce({ data: [], error: null });
    const exps = await getHostExperiences("host-1");
    expect(exps).toEqual([]);
  });
});


