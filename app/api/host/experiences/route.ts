import { NextResponse } from "next/server";
import { requireHost } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import {
  createHostExperience,
  getHostByProfileId,
  listHostExperiences,
} from "@/lib/services/hosts.service";
import { HostExperienceCreateSchema } from "@/lib/validation/host-experience";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requireHost();
    const host = await getHostByProfileId(profile.id);
    if (!host) {
      return NextResponse.json({ error: "Host profile not found", request_id: requestId }, { status: 404 });
    }
    const experiences = await listHostExperiences(host.id);
    return NextResponse.json({ experiences, request_id: requestId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("host experiences GET failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
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
    const parsed = HostExperienceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten(), request_id: requestId },
        { status: 400 },
      );
    }
    const result = await createHostExperience(host.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, request_id: requestId }, { status: 422 });
    }
    return NextResponse.json({ experience: result.row, request_id: requestId }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("host experiences POST failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
