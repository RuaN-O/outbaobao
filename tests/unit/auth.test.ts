import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { POST as loginPost } from "@/app/api/admin/login/route";
import { POST as logoutPost } from "@/app/api/admin/logout/route";
import { readAdminSession, signAdminSession, verifyAdminPassword } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/site-url";
import { middleware } from "@/middleware";

const originalEnv = {
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SITE_URL: process.env.SITE_URL,
};

afterEach(() => {
  process.env.ADMIN_PASSWORD = originalEnv.ADMIN_PASSWORD;
  process.env.SESSION_SECRET = originalEnv.SESSION_SECRET;
  process.env.SITE_URL = originalEnv.SITE_URL;
});

describe("admin auth", () => {
  it("accepts the configured password", async () => {
    expect(await verifyAdminPassword("secret", "secret")).toBe(true);
  });

  it("rejects the wrong password", async () => {
    expect(await verifyAdminPassword("secret", "wrong")).toBe(false);
  });

  it("round-trips the signed session cookie", async () => {
    const cookie = await signAdminSession({ isAdmin: true }, "session-secret");
    const session = await readAdminSession(cookie, "session-secret");

    expect(session?.isAdmin).toBe(true);
  });

  it("redirects login to the current request origin", async () => {
    process.env.ADMIN_PASSWORD = "secret";
    process.env.SESSION_SECRET = "session-secret";
    process.env.SITE_URL = "http://localhost:3000";

    const formData = new FormData();
    formData.set("password", "secret");

    const response = await loginPost(
      new Request("https://jss309309.com/api/admin/login", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://jss309309.com/admin");
  });

  it("redirects logout to the current request origin", async () => {
    process.env.SITE_URL = "http://localhost:3000";

    const response = await logoutPost(
      new Request("https://jss309309.com/api/admin/logout", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://jss309309.com/admin/login");
  });

  it("prefers forwarded host headers when reconstructing request origin", () => {
    const request = new Request("http://localhost:3000/admin/login", {
      headers: {
        "x-forwarded-host": "jss309309.com",
        "x-forwarded-proto": "https",
      },
    });

    expect(getRequestOrigin(request)).toBe("https://jss309309.com");
  });

  it("redirects anonymous admin access using the forwarded host", async () => {
    const request = new NextRequest("http://localhost:3000/admin", {
      headers: {
        "x-forwarded-host": "jss309309.com",
        "x-forwarded-proto": "https",
      },
    });

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://jss309309.com/admin/login");
  });
});
