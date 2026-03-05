import { NextResponse } from "next/server";

export async function GET() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GITHUB_SHA
    ?? process.env.COMMIT_SHA;

  return NextResponse.json({
    ok: true,
    service: "smile-transformation",
    timestamp: new Date().toISOString(),
    ...(commit ? { commit } : {}),
  });
}
