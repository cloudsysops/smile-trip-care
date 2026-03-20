import { describe, expect, it } from "vitest";

import { shouldShowRoleSwitcher } from "@/lib/role-switcher";
import type { ProfileRole } from "@/lib/auth";

describe("RoleSwitcher visibility", () => {
  it("returns false for single role", () => {
    const roles: ProfileRole[] = ["patient"];
    expect(shouldShowRoleSwitcher(roles)).toBe(false);
  });

  it("returns true for multiple roles", () => {
    const roles: ProfileRole[] = ["patient", "host"];
    expect(shouldShowRoleSwitcher(roles)).toBe(true);
  });

  it("returns false for empty list", () => {
    expect(shouldShowRoleSwitcher([])).toBe(false);
  });
});

