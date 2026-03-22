import { describe, it, expect, vi, beforeEach } from "vitest";

/** Minimal fluent query builder for hosts.service tests */
function createQueryBuilder(final: () => Promise<{ data: unknown; error: unknown }>) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.maybeSingle.mockImplementation(final);
  builder.from.mockReturnValue(builder);
  return builder;
}

const profileBuilder = createQueryBuilder(() => Promise.resolve({ data: null, error: null }));
const hostByIdBuilder = createQueryBuilder(() =>
  Promise.resolve({
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
  }),
);

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: vi.fn(),
}));

import { getServerSupabase } from "@/lib/supabase/server";
import { getHostByProfileId, getHostById, getHostExperiences } from "@/lib/services/hosts.service";

const getServerSupabaseMock = vi.mocked(getServerSupabase);

describe("hosts.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getHostByProfileId returns null when no host", async () => {
    getServerSupabaseMock.mockReturnValue(profileBuilder as never);
    const host = await getHostByProfileId("profile-1");
    expect(host).toBeNull();
  });

  it("getHostById returns host when found", async () => {
    getServerSupabaseMock.mockReturnValue(hostByIdBuilder as never);
    const host = await getHostById("host-1");
    expect(host).not.toBeNull();
    expect(host?.id).toBe("host-1");
  });

  it("getHostExperiences returns empty array when no experiences", async () => {
    const experiencesBuilder: Record<string, ReturnType<typeof vi.fn>> = {
      from: vi.fn(),
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    };
    experiencesBuilder.select.mockReturnValue(experiencesBuilder);
    experiencesBuilder.eq.mockReturnValue(experiencesBuilder);
    experiencesBuilder.order.mockImplementation(() => ({
      order: () => Promise.resolve({ data: [], error: null }),
    }));
    experiencesBuilder.from.mockReturnValue(experiencesBuilder);

    getServerSupabaseMock.mockReturnValue(experiencesBuilder as never);
    const exps = await getHostExperiences("host-1");
    expect(exps).toEqual([]);
  });
});
