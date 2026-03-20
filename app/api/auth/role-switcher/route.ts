import { NextResponse } from "next/server";
import { getCurrentProfile, getEffectiveRoleForProfile } from "@/lib/auth";
import { getProfileRoles } from "@/lib/services/roles.service";
import type { ProfileRole } from "@/lib/auth";
import { jsonError } from "@/lib/http/response";

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
  const requestId = crypto.randomUUID();
  const ctx = await getCurrentProfile();
  if (!ctx) {
    return jsonError(401, "Unauthorized", requestId);
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

