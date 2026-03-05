import { type NextRequest, NextResponse } from "next/server";
import { getAuthClient } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const supabase = await getAuthClient();
  await supabase.auth.signOut();
  const url = new URL("/admin/login", request.nextUrl.origin);
  return NextResponse.redirect(url, { status: 302 });
}
