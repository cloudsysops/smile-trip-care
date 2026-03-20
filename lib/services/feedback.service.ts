import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";

export type FeedbackCategory = "ux" | "bug" | "trust" | "performance" | "other";
export type FeedbackSentiment = "positive" | "neutral" | "negative" | "mixed";

export interface SubmitFeedbackParams {
  profileId: string | null;
  email: string | null;
  page: string;
  category?: FeedbackCategory | null;
  sentiment?: FeedbackSentiment | null;
  message: string;
  screenshotUrl?: string | null;
  requestId?: string;
}

export async function submitFeedback(params: SubmitFeedbackParams) {
  const log = createLogger(params.requestId ?? crypto.randomUUID());
  const supabase = getServerSupabase();

  const { error } = await supabase.from("beta_feedback").insert({
    profile_id: params.profileId,
    email: params.email,
    page: params.page,
    category: params.category ?? null,
    sentiment: params.sentiment ?? null,
    message: params.message,
    screenshot_url: params.screenshotUrl ?? null,
  });

  if (error) {
    log.warn("beta_feedback insert failed", {
      error: error.message,
      page: params.page,
    });
    throw new Error("Could not save feedback");
  }
}

