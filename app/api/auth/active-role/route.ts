import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile, getRedirectPathForRole, type ProfileRole } from "@/lib/auth";
import { getProfileRoles } from "@/lib/services/roles.service";
import { getServerSupabase } from "@/lib/supabase/server";

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
  const ctx = await getCurrentProfile();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const requestedRole = parsed.data.role;
  if (!isKnownRole(requestedRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const roleRows = await getProfileRoles(ctx.profile.id);
  const availableRoles = roleRows.map((r) => r.role);
  if (!availableRoles.includes(requestedRole)) {
    return NextResponse.json({ error: "Role not assigned" }, { status: 403 });
  }

  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ active_role: requestedRole })
    .eq("id", ctx.profile.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update active role" }, { status: 500 });
  }

  const redirectPath = getRedirectPathForRole(requestedRole);
  return NextResponse.json({
    ok: true,
    active_role: requestedRole,
    redirectPath,
  });
}

