import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Root middleware: session refresh + /admin gate (see `lib/supabase/middleware.ts`). */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
