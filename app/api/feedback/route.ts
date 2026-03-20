import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { submitFeedback, type FeedbackCategory, type FeedbackSentiment } from "@/lib/services/feedback.service";

const FeedbackBodySchema = z.object({
  page: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(50).optional(),
  sentiment: z.string().trim().min(1).max(50).optional(),
  message: z.string().trim().min(1).max(2000),
  email: z.string().trim().max(320).email().optional(),
  screenshot_url: z.string().url().max(2000).optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const raw = await request.json().catch(() => null);
  const parsed = FeedbackBodySchema.safeParse(raw);
  if (!parsed.success) {
    log.warn("beta_feedback: invalid body", { issues: parsed.error.issues });
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }

  const profileCtx = await getCurrentProfile();

  try {
    await submitFeedback({
      profileId: profileCtx?.profile.id ?? null,
      email: parsed.data.email ?? profileCtx?.profile.email ?? null,
      page: parsed.data.page,
      category: (parsed.data.category as FeedbackCategory | undefined) ?? null,
      sentiment: (parsed.data.sentiment as FeedbackSentiment | undefined) ?? null,
      message: parsed.data.message,
      screenshotUrl: parsed.data.screenshot_url ?? null,
      requestId,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not save feedback. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

