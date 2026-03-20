import type { ProfileRole } from "@/lib/auth";

/**
 * RoleSwitcher must only be shown when the user has more than one assigned role.
 * This keeps the UX clean and avoids unnecessary switching for single-role users.
 */
export function shouldShowRoleSwitcher(availableRoles: readonly ProfileRole[]): boolean {
  return availableRoles.length > 1;
}

