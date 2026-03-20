import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { writeHarvesterMarkReplied } from "@/lib/growth/harvesterState";

const BodySchema = z.object({
  id: z.string().min(1, "id is required").max(200),
  replied: z.boolean(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { id, replied } = parsed.data;

  try {
    await writeHarvesterMarkReplied(id, replied);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("harvester mark-replied write failed", error);
    return NextResponse.json(
      { error: "Could not save state. Try again." },
      { status: 500 },
    );
  }
}
