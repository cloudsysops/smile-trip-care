import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { writeHarvesterMarkReplied } from "@/lib/growth/harvesterState";
import { jsonBadRequest, jsonError } from "@/lib/http/response";

const BodySchema = z.object({
  id: z.string().min(1, "id is required").max(200),
  replied: z.boolean(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    await requireAdmin();
  } catch {
    return jsonError(401, "Unauthorized", requestId);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonBadRequest("Invalid JSON body", requestId);
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid request body";
    return jsonBadRequest(message, requestId);
  }

  const { id, replied } = parsed.data;

  try {
    await writeHarvesterMarkReplied(id, replied);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("harvester mark-replied write failed", error);
    return jsonError(500, "Could not save state. Try again.", requestId);
  }
}
