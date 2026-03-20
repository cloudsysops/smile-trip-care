import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Authenticated users hitting /login redirect to dashboard
  if (pathname === "/login" && user) {
    const next = request.nextUrl.searchParams.get("next");
    if (next) return NextResponse.redirect(new URL(next, request.url));
    return NextResponse.redirect(new URL("/patient", request.url));
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      const redirect = new URL("/admin/login", request.url);
      redirect.searchParams.set("next", pathname);
      return NextResponse.redirect(redirect);
    }
  }

  if (pathname.startsWith("/patient") || pathname.startsWith("/coordinator")) {
    if (!user) {
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}
