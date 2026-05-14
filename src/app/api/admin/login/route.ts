import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signAdminSession, verifyConfiguredAdminPassword } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");

  if (typeof password !== "string" || !(await verifyConfiguredAdminPassword(password))) {
    return NextResponse.json({ message: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const session = await signAdminSession({ isAdmin: true });

  cookieStore.set(ADMIN_SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.redirect(new URL("/admin", request.url));
}
