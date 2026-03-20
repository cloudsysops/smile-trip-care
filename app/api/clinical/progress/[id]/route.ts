/**
 * GET: single treatment progress (role-scoped by RLS).
 * PATCH: update treatment progress (specialist or admin).
 */
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getProgressById, updateProgress } from "@/lib/clinical/progress";
import { getOrderedStageKeys } from "@/lib/clinical/stages";

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
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const row = await getProgressById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { profile } = ctx;
    if (profile.role === "admin") {
      return NextResponse.json({ data: row });
    }
    if (profile.role === "patient" || profile.role === "user") {
      if (row.patient_id !== profile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ data: row });
    }
    if (profile.role === "specialist") {
      if (row.specialist_id !== profile.specialist_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ data: row });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await getCurrentProfile();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { profile } = ctx;
    const isSpecialist = profile.role === "specialist";
    const isAdmin = profile.role === "admin";
    if (!isSpecialist && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getProgressById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!isAdmin && existing.specialist_id !== profile.specialist_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { error: validationError, updates } = parsePatchBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const row = await updateProgress(id, updates);
    return NextResponse.json({ data: row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
