import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminPassword, getSessionSecret } from "@/lib/env";
import type { AdminSession } from "@/lib/session";

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function createSessionSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function verifyAdminPassword(expected: string, incoming: string): Promise<boolean> {
  const expectedBuffer = Buffer.from(expected);
  const incomingBuffer = Buffer.from(incoming);

  if (expectedBuffer.length !== incomingBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, incomingBuffer);
}

export async function verifyConfiguredAdminPassword(incoming: string): Promise<boolean> {
  return verifyAdminPassword(getAdminPassword(), incoming);
}

export async function signAdminSession(
  session: AdminSession,
  secret = getSessionSecret(),
): Promise<string> {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = createSessionSignature(payload, secret);

  return `${payload}.${signature}`;
}

export async function readAdminSession(
  cookieValue: string,
  secret = getSessionSecret(),
): Promise<AdminSession | null> {
  const [payload, signature] = cookieValue.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = createSessionSignature(payload, secret);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const parsed = JSON.parse(fromBase64Url(payload)) as Partial<AdminSession>;

  if (parsed.isAdmin !== true) {
    return null;
  }

  return { isAdmin: true };
}
