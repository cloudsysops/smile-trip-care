import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { submitFeedback, type FeedbackCategory, type FeedbackSentiment } from "@/lib/services/feedback.service";
import { jsonBadRequest, jsonError } from "@/lib/http/response";
import { sanitizeTextInput } from "@/lib/security/sanitize";

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
  const sanitizedRaw =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? {
          ...raw,
          page: sanitizeTextInput((raw as Record<string, unknown>).page, 200),
          category: sanitizeTextInput((raw as Record<string, unknown>).category, 50),
          sentiment: sanitizeTextInput((raw as Record<string, unknown>).sentiment, 50),
          message: sanitizeTextInput((raw as Record<string, unknown>).message, 2000),
          email: sanitizeTextInput((raw as Record<string, unknown>).email, 320),
          screenshot_url: sanitizeTextInput((raw as Record<string, unknown>).screenshot_url, 2000),
        }
      : raw;
  const parsed = FeedbackBodySchema.safeParse(sanitizedRaw);
  if (!parsed.success) {
    log.warn("beta_feedback: invalid body", { issues: parsed.error.issues });
    return jsonBadRequest("Invalid feedback payload", requestId);
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
    return jsonError(500, "Could not save feedback. Please try again later.", requestId);
  }

  return NextResponse.json({ ok: true });
}

