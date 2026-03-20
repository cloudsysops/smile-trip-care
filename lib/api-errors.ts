import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

export function createApiRequestContext() {
  const requestId = crypto.randomUUID();
  return {
    requestId,
    log: createLogger(requestId),
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function internalServerError(requestId: string) {
  return NextResponse.json(
    { error: "Internal server error", request_id: requestId },
    { status: 500 },
  );
}
