import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile, getRedirectPathForRole, type ProfileRole } from "@/lib/auth";
import { getProfileRoles } from "@/lib/services/roles.service";
import { getServerSupabase } from "@/lib/supabase/server";
import { jsonBadRequest, jsonError } from "@/lib/http/response";

const BodySchema = z.object({
  role: z.string().min(1),
});

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

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const ctx = await getCurrentProfile();
  if (!ctx) {
    return jsonError(401, "Unauthorized", requestId);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonBadRequest("Invalid body", requestId);
  }

  const requestedRole = parsed.data.role;
  if (!isKnownRole(requestedRole)) {
    return jsonBadRequest("Invalid role", requestId);
  }

  const roleRows = await getProfileRoles(ctx.profile.id);
  const availableRoles = roleRows.map((r) => r.role);
  if (!availableRoles.includes(requestedRole)) {
    return jsonError(403, "Role not assigned", requestId);
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ active_role: requestedRole })
    .eq("id", ctx.profile.id);

  if (error) {
    return jsonError(500, "Failed to update active role", requestId);
  }

  const redirectPath = getRedirectPathForRole(requestedRole);
  return NextResponse.json({
    ok: true,
    active_role: requestedRole,
    redirectPath,
  });
}

