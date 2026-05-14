import { NextResponse } from "next/server";
import { signAdminSession, verifyConfiguredAdminPassword } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");

  if (typeof password !== "string" || !(await verifyConfiguredAdminPassword(password))) {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  }

  const session = await signAdminSession({ isAdmin: true });
  const response = NextResponse.redirect(new URL("/admin", getSiteUrl()), { status: 303 });

  response.cookies.set(ADMIN_SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
