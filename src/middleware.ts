import { NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return true;
  }

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login" && pathname !== "/api/admin/logout") {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!cookieValue) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const session = await readAdminSession(cookieValue);

  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
