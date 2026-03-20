import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getSpecialistById, updateSpecialist } from "@/lib/specialists";
import { SpecialistUpdateSchema } from "@/lib/validation/specialist";
import { RouteIdParamSchema } from "@/lib/validation/common";
import { getServerSupabase } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const parsed = RouteIdParamSchema.safeParse(await params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id", request_id: requestId }, { status: 400 });
    }
    const specialist = await getSpecialistById(parsed.data.id);
    if (!specialist) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json(specialist);
  } catch (err) {
    log.error("Admin specialist GET failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Props) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const parsedParams = RouteIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Invalid id", request_id: requestId }, { status: 400 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body", request_id: requestId },
        { status: 400 }
      );
    }
    const profileId = (body as Record<string, unknown>).profile_id;
    if (profileId !== undefined) {
      if (typeof profileId !== "string" || profileId.length === 0) {
        return NextResponse.json(
          { error: "Invalid profile_id", request_id: requestId },
          { status: 400 }
        );
      }
      const specialist = await getSpecialistById(parsedParams.data.id);
      if (!specialist) {
        return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
      }
      const supabase = getServerSupabase();
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", profileId)
        .eq("is_active", true)
        .maybeSingle();
      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Profile not found", request_id: requestId },
          { status: 404 }
        );
      }
      await supabase
        .from("profiles")
        .update({ specialist_id: null })
        .eq("specialist_id", parsedParams.data.id)
        .neq("id", profileId);
      await supabase
        .from("profiles")
        .update({
          specialist_id: parsedParams.data.id,
          role: "specialist",
          active_role: "specialist",
        })
        .eq("id", profileId);
      await supabase
        .from("profile_roles")
        .upsert(
          {
            profile_id: profileId,
            role: "specialist",
            is_active: true,
          },
          { onConflict: "profile_id,role" }
        );
      return NextResponse.json({
        ok: true,
        specialist_id: parsedParams.data.id,
        linked_profile: profile,
      });
    }
    const parsed = SpecialistUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 }
      );
    }
    const { data, error } = await updateSpecialist(parsedParams.data.id, parsed.data);
    if (error) {
      return NextResponse.json(
        { error: error || "Update failed", request_id: requestId },
        { status: 422 }
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    log.error("Admin specialist PATCH failed", { err: String(err) });
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500 }
    );
  }
}
