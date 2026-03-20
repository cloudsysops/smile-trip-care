import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";

export type AiRouteContext = {
  requestId: string;
  log: ReturnType<typeof createLogger>;
};

export function createAiRouteContext(): AiRouteContext {
  const requestId = crypto.randomUUID();
  return {
    requestId,
    log: createLogger(requestId),
  };
}

export async function ensureAiRouteAccess(requestId: string): Promise<NextResponse | null> {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured", request_id: requestId },
      { status: 500 },
    );
  }

  return null;
}

export function aiJsonError(requestId: string, error: string, status: number) {
  return NextResponse.json({ error, request_id: requestId }, { status });
}
