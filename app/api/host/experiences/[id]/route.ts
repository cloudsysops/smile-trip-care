import { NextResponse } from "next/server";
import { requireHost } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import {
  getHostByProfileId,
  getHostExperienceById,
  softDeleteHostExperience,
  updateHostExperience,
} from "@/lib/services/hosts.service";
import { HostExperiencePatchSchema } from "@/lib/validation/host-experience";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const { id } = await ctx.params;
  try {
    const { profile } = await requireHost();
    const host = await getHostByProfileId(profile.id);
    if (!host) {
      return NextResponse.json({ error: "Host profile not found", request_id: requestId }, { status: 404 });
    }
    const experience = await getHostExperienceById(host.id, id);
    if (!experience) {
      return NextResponse.json({ error: "Not found", request_id: requestId }, { status: 404 });
    }
    return NextResponse.json({ experience, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("host experience GET failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const { id } = await ctx.params;
  try {
    const { profile } = await requireHost();
    const host = await getHostByProfileId(profile.id);
    if (!host) {
      return NextResponse.json({ error: "Host profile not found", request_id: requestId }, { status: 404 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
    }
    const parsed = HostExperiencePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 },
      );
    }
    const result = await updateHostExperience(host.id, id, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, request_id: requestId }, { status: 422 });
    }
    return NextResponse.json({ experience: result.row, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("host experience PATCH failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: RouteCtx) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const { id } = await ctx.params;
  try {
    const { profile } = await requireHost();
    const host = await getHostByProfileId(profile.id);
    if (!host) {
      return NextResponse.json({ error: "Host profile not found", request_id: requestId }, { status: 404 });
    }
    const result = await softDeleteHostExperience(host.id, id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, request_id: requestId }, { status: 422 });
    }
    return NextResponse.json({ ok: true, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("host experience DELETE failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
