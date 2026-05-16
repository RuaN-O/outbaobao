import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/site-url";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", getRequestOrigin(request)), { status: 303 });

  response.cookies.delete(ADMIN_SESSION_COOKIE);

  return response;
}
