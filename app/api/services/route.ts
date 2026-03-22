import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listPublicServices } from "@/lib/services/marketplace-services";
import { createLogger } from "@/lib/logger";

const QuerySchema = z.object({
  category: z
    .enum(["all", "lodging", "transport", "experience", "therapy", "accompaniment", "other"])
    .optional(),
});

/** Public catalog — no auth. */
export async function GET(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const raw = req.nextUrl.searchParams.get("category") ?? undefined;
    const parsed = QuerySchema.safeParse(raw ? { category: raw } : {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid category", request_id: requestId }, { status: 400 });
    }
    const category = parsed.data.category === "all" ? undefined : parsed.data.category;
    const services = await listPublicServices(category ?? null);
    return NextResponse.json({ services, request_id: requestId });
  } catch (e) {
    log.error("GET /api/services failed", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Failed to load services", request_id: requestId }, { status: 500 });
  }
}
