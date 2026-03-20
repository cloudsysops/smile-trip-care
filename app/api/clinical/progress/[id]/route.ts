/**
 * GET: single treatment progress (role-scoped by RLS).
 * PATCH: update treatment progress (specialist or admin).
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getProgressById, updateProgress } from "@/lib/clinical/progress";
import { getOrderedStageKeys } from "@/lib/clinical/stages";
import { jsonBadRequest, jsonError, jsonForbidden } from "@/lib/http/response";

const STAGE_KEYS = getOrderedStageKeys();
const VALID_STATUSES = ["active", "completed", "cancelled"] as const;

type Params = { params: Promise<{ id: string }> };

type UpdatePayload = {
  stage_key?: string;
  stage_label?: string | null;
  status?: string;
  notes?: string | null;
};

function parsePatchBody(body: Record<string, unknown>): { error?: string; updates: UpdatePayload } {
  const updates: UpdatePayload = {};
  const stage_key = body.stage_key as unknown;
  const stage_label = body.stage_label as unknown;
  const status = body.status as unknown;
  const notes = body.notes as unknown;
  if (stage_key !== undefined) {
    if (typeof stage_key !== "string" || !STAGE_KEYS.includes(stage_key as (typeof STAGE_KEYS)[number])) {
      return { error: "Invalid stage_key", updates: {} };
    }
    updates.stage_key = stage_key;
  }
  if (stage_label !== undefined) updates.stage_label = typeof stage_label === "string" ? stage_label : null;
  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return { error: "Invalid status", updates: {} };
    }
    updates.status = status;
  }
  if (notes !== undefined) updates.notes = typeof notes === "string" ? notes : null;
  return { updates };
}

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
    if (profile.role === "admin") {
      return NextResponse.json({ data: row });
    }
    if (profile.role === "patient" || profile.role === "user") {
      if (row.patient_id !== profile.id) {
        return jsonForbidden(requestId);
      }
      return NextResponse.json({ data: row });
    }
    if (profile.role === "specialist") {
      if (row.specialist_id !== profile.specialist_id) {
        return jsonForbidden(requestId);
      }
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
    const isSpecialist = profile.role === "specialist";
    const isAdmin = profile.role === "admin";
    if (!isSpecialist && !isAdmin) {
      return jsonForbidden(requestId);
    }

    const { id } = await params;
    const existing = await getProgressById(id);
    if (!existing) {
      return jsonError(404, "Not found", requestId);
    }
    if (!isAdmin && existing.specialist_id !== profile.specialist_id) {
      return jsonForbidden(requestId);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { error: validationError, updates } = parsePatchBody(body);
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
