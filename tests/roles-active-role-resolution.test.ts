import { describe, expect, it } from "vitest";
import { resolveActiveRole } from "@/lib/services/roles.service";

describe("resolveActiveRole", () => {
  it("uses active_role when it is assigned", () => {
    const result = resolveActiveRole("patient", "host", ["patient", "host"]);
    expect(result).toBe("host");
  });

  it("falls back to primaryRole when active_role is not assigned", () => {
    const result = resolveActiveRole("specialist", "admin", ["specialist", "patient"]);
    expect(result).toBe("specialist");
  });

  it("falls back to first available role when primaryRole is not assigned", () => {
    const result = resolveActiveRole("host", "admin", ["specialist", "patient"]);
    expect(result).toBe("specialist");
  });

  it("returns primaryRole when no roles are assigned", () => {
    const result = resolveActiveRole("patient", "host", []);
    expect(result).toBe("patient");
  });
});

