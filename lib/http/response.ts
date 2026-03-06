import { NextResponse } from "next/server";

type ApiErrorPayload = {
  ok: false;
  error: string;
  request_id?: string;
};

export function jsonError(status: number, error: string, requestId?: string) {
  const payload: ApiErrorPayload = {
    ok: false,
    error,
    ...(requestId ? { request_id: requestId } : {}),
  };
  return NextResponse.json(payload, { status });
}

export function jsonForbidden(requestId?: string) {
  return jsonError(403, "Forbidden", requestId);
}

export function jsonBadRequest(error: string, requestId?: string) {
  return jsonError(400, error, requestId);
}

export function jsonInternalServerError(requestId?: string) {
  return jsonError(500, "Internal server error", requestId);
}
