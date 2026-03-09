import { NextResponse } from "next/server";
// Version from package.json at build time; override with APP_VERSION in Vercel if needed.
import packageJson from "../../../package.json";

/** Simple status for monitoring, uptime checks, quick debugging. */
export async function GET() {
  const version =
    process.env.APP_VERSION ?? (packageJson as { version?: string }).version ?? "0.1.0";
  return NextResponse.json({
    app: "medvoyage-smile",
    status: "ok",
    version,
  });
}
