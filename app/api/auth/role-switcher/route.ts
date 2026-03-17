import { NextResponse } from "next/server";
import { getCurrentProfile, getEffectiveRoleForProfile } from "@/lib/auth";
import { getProfileRoles } from "@/lib/services/roles.service";
import type { ProfileRole } from "@/lib/auth";

const KNOWN_ROLES: readonly ProfileRole[] = [
  "admin",
  "coordinator",
  "provider_manager",
  "host",
  "specialist",
  "patient",
  "user",
];

function isKnownRole(role: string): role is ProfileRole {
  return KNOWN_ROLES.includes(role as ProfileRole);
}

export async function GET() {
  const ctx = await getCurrentProfile();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profile } = ctx;
  const roleRows = await getProfileRoles(profile.id);
  const availableRoles = roleRows.map((r) => r.role).filter(isKnownRole);

  const effectiveRole = await getEffectiveRoleForProfile(profile);
  return NextResponse.json({
    ok: true,
    availableRoles,
    effectiveRole,
  });
}

