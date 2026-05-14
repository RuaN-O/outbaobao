import { describe, expect, it } from "vitest";
import { readAdminSession, signAdminSession, verifyAdminPassword } from "@/lib/auth";

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
});
