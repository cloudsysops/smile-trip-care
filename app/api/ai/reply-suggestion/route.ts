import { NextResponse } from "next/server";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth";
import { generateAiReplyForHarvester } from "@/lib/ai/aiResponder";

const BodySchema = z.object({
  postText: z.string().min(1, "postText is required").max(8000),
  keyword: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

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

  const { postText, keyword } = parsed.data;

  try {
    const result = await generateAiReplyForHarvester(postText, keyword);
    return NextResponse.json(
      {
        reply: result.reply,
        fallbackUsed: result.fallbackUsed,
      },
      { status: 200 },
    );
  } catch (error) {
    log.error("AI reply suggestion failed", { error });
    return NextResponse.json(
      {
        error: "Could not generate reply. Please try again or use the template reply.",
      },
      { status: 500 },
    );
  }
}

