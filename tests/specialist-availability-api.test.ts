import { beforeEach, describe, expect, it, vi } from "vitest";

const requireSpecialistMock = vi.fn();
const getSlotsMock = vi.fn();
const replaceSlotsMock = vi.fn();

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireSpecialist: requireSpecialistMock,
  };
});

vi.mock("@/lib/services/specialist-availability.service", () => ({
  getAvailabilitySlotsForSpecialist: getSlotsMock,
  replaceAvailabilityForSpecialist: replaceSlotsMock,
}));

describe("/api/specialist/availability", () => {
  beforeEach(() => {
    requireSpecialistMock.mockReset();
    getSlotsMock.mockReset();
    replaceSlotsMock.mockReset();
  });

  it("GET returns 401 when unauthenticated", async () => {
    requireSpecialistMock.mockRejectedValueOnce(new Error("Unauthorized"));
    const { GET } = await import("@/app/api/specialist/availability/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns 403 when no specialist_id", async () => {
    requireSpecialistMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1", specialist_id: null },
    });
    const { GET } = await import("@/app/api/specialist/availability/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("GET returns slots", async () => {
    requireSpecialistMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1", specialist_id: "spec-1" },
    });
    getSlotsMock.mockResolvedValueOnce([{ day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true }]);
    const { GET } = await import("@/app/api/specialist/availability/route");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      slots: [{ day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true }],
    });
  });

  it("PATCH validates body", async () => {
    requireSpecialistMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1", specialist_id: "spec-1" },
    });
    const { PATCH } = await import("@/app/api/specialist/availability/route");
    const res = await PATCH(
      new Request("http://localhost/api/specialist/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: [{ day_of_week: 9, start_time: "09:00", end_time: "17:00", is_available: true }] }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("PATCH saves and returns slots", async () => {
    requireSpecialistMock.mockResolvedValueOnce({
      user: { id: "u1" },
      profile: { id: "u1", specialist_id: "spec-1" },
    });
    replaceSlotsMock.mockResolvedValueOnce({ error: null });
    getSlotsMock.mockResolvedValueOnce([]);
    const { PATCH } = await import("@/app/api/specialist/availability/route");
    const res = await PATCH(
      new Request("http://localhost/api/specialist/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: [{ day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true }] }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, slots: [] });
    expect(replaceSlotsMock).toHaveBeenCalledWith("spec-1", [
      { day_of_week: 1, start_time: "09:00", end_time: "17:00", is_available: true },
    ]);
  });
});
