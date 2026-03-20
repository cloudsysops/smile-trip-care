/**
 * GET: single treatment progress (role-scoped by RLS).
 * PATCH: update treatment progress (specialist or admin).
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getProgressById, updateProgress } from "@/lib/clinical/progress";
import { getOrderedStageKeys } from "@/lib/clinical/stages";
import { jsonBadRequest, jsonError, jsonForbidden } from "@/lib/http/response";
import {
  canUpdateProgress,
  canViewProgress,
  parseProgressPatchBody,
} from "@/lib/services/clinical/progress-policy.service";

const STAGE_KEYS = getOrderedStageKeys();

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return jsonError(401, "Unauthorized", requestId);
    }
    const { id } = await params;
    const row = await getProgressById(id);
    if (!row) {
      return jsonError(404, "Not found", requestId);
    }
    const { profile } = ctx;
    if (!canViewProgress(profile, row)) {
      return jsonForbidden(requestId);
    }
    if (profile.role === "admin" || profile.role === "patient" || profile.role === "user" || profile.role === "specialist") {
      return NextResponse.json({ data: row });
    }
    return jsonForbidden(requestId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return jsonError(500, message, requestId);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const requestId = crypto.randomUUID();
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return jsonError(401, "Unauthorized", requestId);
    }
    const { profile } = ctx;
    const { id } = await params;
    const existing = await getProgressById(id);
    if (!existing) {
      return jsonError(404, "Not found", requestId);
    }
    if (!canUpdateProgress(profile, existing)) {
      return jsonForbidden(requestId);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { error: validationError, updates } = parseProgressPatchBody(body, STAGE_KEYS);
    if (validationError) {
      return jsonBadRequest(validationError, requestId);
    }

    const row = await updateProgress(id, updates);
    return NextResponse.json({ data: row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return jsonError(500, message, requestId);
  }
}
